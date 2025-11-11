"""
Unit tests for manifest reader.
"""
import tempfile
from pathlib import Path
from django.test import TestCase

from server.watershed.manifest_reader import ManifestReader, ManifestEntry


class ManifestReaderTests(TestCase):
    """Test manifest parsing and subsetting."""
    
    def setUp(self):
        """Create temporary test manifest."""
        self.temp_dir = tempfile.mkdtemp()
        self.manifest_path = Path(self.temp_dir) / 'test-manifest.yaml'
        
        # Create minimal valid manifest
        manifest_content = """
Watersheds:
  - name: test-watershed-1
    url: https://example.com/watershed1.geojson
    target: watersheds/test1.geojson

Subcatchments:
  - name: test-sub-1
    url: https://example.com/sub1.geojson
    target: subcatchments/sub1.geojson
  - name: test-sub-2
    url: https://example.com/sub2.geojson
    target: subcatchments/sub2.geojson
  - name: test-sub-3
    url: https://example.com/sub3.geojson
    target: subcatchments/sub3.geojson

Channels:
  - name: test-channel-1
    url: https://example.com/channel1.geojson
    target: channels/channel1.geojson
  - name: test-channel-2
    url: https://example.com/channel2.geojson
    target: channels/channel2.geojson
"""
        with open(self.manifest_path, 'w') as f:
            f.write(manifest_content)
    
    def test_load_manifest(self):
        """Should load and parse YAML manifest."""
        reader = ManifestReader(self.manifest_path)
        data = reader.load()
        
        self.assertIn('Watersheds', data)
        self.assertIn('Subcatchments', data)
        self.assertIn('Channels', data)
    
    def test_get_entry_counts(self):
        """Should return correct counts per section."""
        reader = ManifestReader(self.manifest_path)
        reader.load()
        counts = reader.get_entry_counts()
        
        self.assertEqual(counts['watersheds'], 1)
        self.assertEqual(counts['subcatchments'], 3)
        self.assertEqual(counts['channels'], 2)
    
    def test_get_entries_all_scope(self):
        """With 'all' scope, should return all entries."""
        reader = ManifestReader(self.manifest_path)
        entries = reader.get_entries(scope='all')
        
        self.assertEqual(len(entries['watersheds']), 1)
        self.assertEqual(len(entries['subcatchments']), 3)
        self.assertEqual(len(entries['channels']), 2)
    
    def test_get_entries_dev_subset(self):
        """With 'dev_subset' scope, should limit subcatchments and match channels to same runids."""
        reader = ManifestReader(self.manifest_path)
        entries = reader.get_entries(scope='dev_subset', subset_size=2)
        
        # Watersheds: always loads all (contains all runids in one file)
        self.assertEqual(len(entries['watersheds']), 1)
        
        # Subcatchments: limited to subset_size
        self.assertEqual(len(entries['subcatchments']), 2)
        
        # Channels: should match the same runids as subcatchments
        self.assertEqual(len(entries['channels']), 2)
        
        # Verify channels match subcatchment names (runids)
        sub_names = {e.name for e in entries['subcatchments']}
        channel_names = {e.name for e in entries['channels']}
        self.assertEqual(sub_names, channel_names)
    
    def test_manifest_entry_structure(self):
        """ManifestEntry should have correct fields."""
        reader = ManifestReader(self.manifest_path)
        entries = reader.get_entries(scope='all')
        
        entry = entries['watersheds'][0]
        self.assertIsInstance(entry, ManifestEntry)
        self.assertEqual(entry.name, 'test-watershed-1')
        self.assertEqual(entry.url, 'https://example.com/watershed1.geojson')
        self.assertEqual(entry.target, 'watersheds/test1.geojson')
        self.assertEqual(entry.section, 'Watersheds')
    
    def test_validate_valid_manifest(self):
        """Valid manifest should pass validation."""
        reader = ManifestReader(self.manifest_path)
        reader.load()
        errors = reader.validate()
        
        self.assertEqual(len(errors), 0)
    
    def test_validate_missing_field(self):
        """Manifest with missing required field should fail validation."""
        # Create invalid manifest
        invalid_path = Path(self.temp_dir) / 'invalid.yaml'
        with open(invalid_path, 'w') as f:
            f.write("""
Watersheds:
  - name: test
    url: https://example.com/test.geojson
    # Missing 'target' field

Subcatchments: []
Channels: []
""")
        
        reader = ManifestReader(invalid_path)
        reader.load()
        errors = reader.validate()
        
        self.assertGreater(len(errors), 0)
        self.assertTrue(any('target' in err for err in errors))
    
    def test_nonexistent_manifest_raises_error(self):
        """Loading nonexistent manifest should raise FileNotFoundError."""
        reader = ManifestReader(Path('/nonexistent/manifest.yaml'))
        
        with self.assertRaises(FileNotFoundError):
            reader.load()
