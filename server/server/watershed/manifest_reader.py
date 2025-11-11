"""
Manifest reader for watershed data ingestion.

Parses YAML manifest and supports subsetting based on scope configuration.
"""
import sys
import yaml
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class ManifestEntry:
    """Single entry in the data manifest."""
    name: str
    url: str
    target: str
    section: str  # 'Watersheds', 'Subcatchments', or 'Channels'


class ManifestReader:
    """
    Reads and parses the data manifest YAML file.
    
    Supports subsetting for development environments and provides
    structured access to manifest entries.
    """
    
    def __init__(self, manifest_path: Path):
        """
        Initialize the manifest reader.
        
        Args:
            manifest_path: Path to the YAML manifest file
        """
        self.manifest_path = Path(manifest_path)
        self._raw_data: Optional[Dict] = None
        
    def load(self) -> Dict:
        """
        Load and parse the manifest YAML file.
        
        Returns:
            Dict with 'Watersheds', 'Subcatchments', 'Channels' keys
            
        Raises:
            FileNotFoundError: If manifest file doesn't exist
            yaml.YAMLError: If manifest is malformed
        """
        if not self.manifest_path.exists():
            raise FileNotFoundError(f"Manifest file not found: {self.manifest_path}")
        
        try:
            with open(self.manifest_path) as f:
                self._raw_data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise ValueError(f"Failed to parse manifest YAML: {e}")
        
        if not self._raw_data:
            raise ValueError("Manifest is empty")
        
        return self._raw_data
    
    def get_entries(self, scope: str = 'all', subset_size: int = 50) -> Dict[str, List[ManifestEntry]]:
        """
        Get manifest entries based on scope configuration.
        
        For 'dev_subset', loads a subset of RUNIDS (first N subcatchments/channels)
        along with ALL watersheds (since the watershed file contains all runids).
        This ensures we load complete watershed data for the subset.
        
        Args:
            scope: 'all', 'dev_subset', or 'dev'
            subset_size: Number of runids (subcatchments) to load in dev mode
            
        Returns:
            Dict with keys 'watersheds', 'subcatchments', 'channels' containing
            lists of ManifestEntry objects
        """
        if self._raw_data is None:
            self.load()
        
        result = {
            'watersheds': [],
            'subcatchments': [],
            'channels': []
        }
        
        # Process watersheds - always load all (file contains all runids)
        if 'Watersheds' in self._raw_data:
            result['watersheds'] = [
                ManifestEntry(
                    name=entry['name'],
                    url=entry['url'],
                    target=entry['target'],
                    section='Watersheds'
                )
                for entry in self._raw_data['Watersheds']
            ]
        
        # Process subcatchments - subset in dev mode
        if 'Subcatchments' in self._raw_data:
            raw_subcatchments = self._raw_data['Subcatchments']
            if scope in ('dev_subset', 'dev'):
                # Take first N subcatchments (each represents a runid)
                raw_subcatchments = raw_subcatchments[:subset_size]
            
            result['subcatchments'] = [
                ManifestEntry(
                    name=entry['name'],
                    url=entry['url'],
                    target=entry['target'],
                    section='Subcatchments'
                )
                for entry in raw_subcatchments
            ]
        
        # Process channels - match the same runids as subcatchments
        if 'Channels' in self._raw_data:
            raw_channels = self._raw_data['Channels']
            
            if scope in ('dev_subset', 'dev'):
                # Get the runids from selected subcatchments
                selected_runids = {entry['name'] for entry in raw_subcatchments}
                
                # Filter channels to match those runids
                raw_channels = [
                    entry for entry in raw_channels
                    if entry['name'] in selected_runids
                ]
            
            result['channels'] = [
                ManifestEntry(
                    name=entry['name'],
                    url=entry['url'],
                    target=entry['target'],
                    section='Channels'
                )
                for entry in raw_channels
            ]
        
        return result
    
    def get_entry_counts(self) -> Dict[str, int]:
        """
        Get counts of entries per section without loading full entries.
        
        Returns:
            Dict with counts: {'watersheds': N, 'subcatchments': N, 'channels': N}
        """
        if self._raw_data is None:
            self.load()
        
        return {
            'watersheds': len(self._raw_data.get('Watersheds', [])),
            'subcatchments': len(self._raw_data.get('Subcatchments', [])),
            'channels': len(self._raw_data.get('Channels', []))
        }
    
    def validate(self) -> List[str]:
        """
        Validate manifest structure and return any issues found.
        
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        
        if self._raw_data is None:
            self.load()
        
        # Check for required sections
        for section in ['Watersheds', 'Subcatchments', 'Channels']:
            if section not in self._raw_data:
                errors.append(f"Missing required section: {section}")
                continue
            
            # Check each entry has required fields
            for i, entry in enumerate(self._raw_data[section]):
                if not isinstance(entry, dict):
                    errors.append(f"{section}[{i}]: Entry is not a dictionary")
                    continue
                
                for field in ['name', 'url', 'target']:
                    if field not in entry:
                        errors.append(f"{section}[{i}]: Missing required field '{field}'")
        
        return errors
