"""
Structured logging utilities for data loading operations.

Provides progress tracking, timing information, and structured log output
for long-running data loading tasks.
"""

import logging
import time
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum

class LoadPhase(Enum):
    """Phases of the data loading pipeline."""
    INITIALIZING = "initializing"
    LOADING_WATERSHEDS = "loading_watersheds"
    LOADING_SUBCATCHMENTS = "loading_subcatchments"
    LOADING_CHANNELS = "loading_channels"
    LOADING_PARQUET = "loading_parquet"
    SIMPLIFYING_GEOMETRY = "simplifying_geometry"
    COMPLETE = "complete"


@dataclass
class LoadingProgress:
    """
    Tracks progress through the data loading pipeline.
    
    Provides real-time statistics including completion percentage,
    elapsed time, and estimated time remaining.
    """
    phase: LoadPhase = LoadPhase.INITIALIZING
    total_items: int = 0
    processed_items: int = 0
    current_item: Optional[str] = None
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    start_time: float = field(default_factory=time.time)
    phase_start_time: float = field(default_factory=time.time)
    
    @property
    def percent_complete(self) -> float:
        """Calculate percentage of current phase completed."""
        if self.total_items == 0:
            return 0.0
        return (self.processed_items / self.total_items) * 100
    
    @property
    def elapsed_seconds(self) -> float:
        """Total elapsed time since loading started."""
        return time.time() - self.start_time
    
    @property
    def phase_elapsed_seconds(self) -> float:
        """Elapsed time since current phase started."""
        return time.time() - self.phase_start_time
    
    def estimate_remaining_seconds(self) -> float:
        """Estimate remaining time based on current progress rate."""
        if self.processed_items == 0:
            return 0.0
        per_item = self.phase_elapsed_seconds / self.processed_items
        remaining = self.total_items - self.processed_items
        return per_item * remaining
    
    def format_time(self, seconds: float) -> str:
        """Format seconds as human-readable duration."""
        if seconds < 60:
            return f"{seconds:.1f}s"
        elif seconds < 3600:
            minutes = int(seconds // 60)
            secs = int(seconds % 60)
            return f"{minutes}m {secs}s"
        else:
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)
            return f"{hours}h {minutes}m"


class LoaderLogger:
    """
    Structured logger for data loading operations.
    
    Provides consistent, informative log output with progress tracking,
    timing information, and summary statistics.
    
    Example:
        logger = LoaderLogger()
        logger.start_phase(LoadPhase.LOADING_SUBCATCHMENTS, total_items=395)
        for runid in runids:
            # ... do work ...
            logger.item_complete(runid, records_saved=12)
        logger.end_phase()
    """
    
    def __init__(self, name: str = "watershed.loader"):
        self._logger = logging.getLogger(name)
        self.progress = LoadingProgress()
        self._phase_stats: dict[LoadPhase, dict] = {}
    
    def start_phase(self, phase: LoadPhase, total_items: int = 0) -> None:
        """Begin a new loading phase with the expected item count."""
        self.progress.phase = phase
        self.progress.total_items = total_items
        self.progress.processed_items = 0
        self.progress.phase_start_time = time.time()
        
        self._logger.info(
            f"[{phase.value}] Starting: {total_items} items to process"
        )
    
    def item_start(self, item_name: str) -> None:
        """Mark the start of processing a single item."""
        self.progress.current_item = item_name
        self._logger.debug(f"Processing: {item_name}")
    
    def item_complete(self, item_name: str, records_saved: int = 0, extra_info: str = "") -> None:
        """
        Mark an item as complete and log progress.
        
        Args:
            item_name: Identifier for the completed item (e.g., runid)
            records_saved: Number of database records saved
            extra_info: Optional additional information to include
        """
        self.progress.processed_items += 1
        self.progress.current_item = None
        
        pct = self.progress.percent_complete
        remaining = self.progress.estimate_remaining_seconds()
        remaining_str = self.progress.format_time(remaining) if remaining > 0 else "calculating..."
        
        msg = (
            f"[{self.progress.processed_items}/{self.progress.total_items}] "
            f"{item_name}: {records_saved} records "
            f"({pct:.1f}% complete, ~{remaining_str} remaining)"
        )
        if extra_info:
            msg += f" - {extra_info}"
        
        self._logger.info(msg)
    
    def item_skipped(self, item_name: str, reason: str = "") -> None:
        """Log that an item was skipped."""
        self.progress.processed_items += 1
        msg = f"Skipped: {item_name}"
        if reason:
            msg += f" ({reason})"
        self._logger.debug(msg)
    
    def item_error(self, item_name: str, error: Exception) -> None:
        """Log an error for a specific item."""
        error_msg = f"{item_name}: {type(error).__name__}: {error}"
        self.progress.errors.append(error_msg)
        self._logger.error(f"Error processing {error_msg}")
    
    def warning(self, message: str) -> None:
        """Log a warning message."""
        self.progress.warnings.append(message)
        self._logger.warning(message)
    
    def end_phase(self, records_saved: int = 0) -> None:
        """
        Complete the current phase and log summary statistics.
        
        Args:
            records_saved: Total records saved during this phase
        """
        elapsed = self.progress.phase_elapsed_seconds
        elapsed_str = self.progress.format_time(elapsed)
        
        # Store phase statistics
        self._phase_stats[self.progress.phase] = {
            "items_processed": self.progress.processed_items,
            "records_saved": records_saved,
            "elapsed_seconds": elapsed,
            "errors": len(self.progress.errors),
        }
        
        self._logger.info(
            f"[{self.progress.phase.value}] Complete: "
            f"{self.progress.processed_items} items processed, "
            f"{records_saved} records saved in {elapsed_str}"
        )
    
    def summary(self) -> None:
        """Log final summary of all loading phases."""
        total_elapsed = self.progress.format_time(self.progress.elapsed_seconds)
        error_count = len(self.progress.errors)
        warning_count = len(self.progress.warnings)
        
        self._logger.info("=" * 60)
        self._logger.info(f"Data loading complete in {total_elapsed}")
        
        for phase, stats in self._phase_stats.items():
            self._logger.info(
                f"  {phase.value}: {stats['records_saved']} records "
                f"({stats['items_processed']} items, "
                f"{self.progress.format_time(stats['elapsed_seconds'])})"
            )
        
        if error_count > 0:
            self._logger.warning(f"  Errors: {error_count}")
            for error in self.progress.errors[:5]:  # Show first 5 errors
                self._logger.warning(f"    - {error}")
            if error_count > 5:
                self._logger.warning(f"    ... and {error_count - 5} more")
        
        if warning_count > 0:
            self._logger.info(f"  Warnings: {warning_count}")
        
        self._logger.info("=" * 60)


def configure_logging(level: int = logging.INFO, verbose: bool = False) -> None:
    """
    Configure logging for the watershed loader.
    
    Args:
        level: Base logging level (default: INFO)
        verbose: If True, set level to DEBUG for detailed output
    """
    if verbose:
        level = logging.DEBUG
    
    # Configure the watershed.loader logger
    loader_logger = logging.getLogger("watershed.loader")
    loader_logger.setLevel(level)
    
    # Only add handler if none exist (avoid duplicate handlers)
    if not loader_logger.handlers:
        handler = logging.StreamHandler()
        handler.setLevel(level)
        formatter = logging.Formatter(
            "%(asctime)s [%(levelname)s] %(message)s",
            datefmt="%H:%M:%S"
        )
        handler.setFormatter(formatter)
        loader_logger.addHandler(handler)
