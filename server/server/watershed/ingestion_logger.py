"""
Structured logging helper for ingestion pipeline.

Provides consistent, actionable logging with support for both
key-value and JSON output formats.
"""
import json
import logging
import time
import uuid
from typing import Optional, Dict, Any
from datetime import datetime


class IngestionLogger:
    """
    Wrapper around standard logging with ingestion-specific context.
    
    Supports structured logging with run IDs and correlation IDs for
    tracking data flow across download → load → insert stages.
    """
    
    def __init__(self, name: str = __name__, log_json: bool = False, run_id: Optional[str] = None):
        """
        Initialize the ingestion logger.
        
        Args:
            name: Logger name (typically module name)
            log_json: If True, emit JSON-formatted logs; else key-value format
            run_id: Unique identifier for this ingestion run (auto-generated if None)
        """
        self.logger = logging.getLogger(name)
        self.log_json = log_json
        self.run_id = run_id or self._generate_run_id()
        self.start_time = time.time()
        
    @staticmethod
    def _generate_run_id() -> str:
        """Generate a unique run identifier."""
        return f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
    
    def _format_message(self, level: str, message: str, **context) -> str:
        """
        Format log message based on output mode (JSON or key-value).
        
        Args:
            level: Log level (INFO, DEBUG, WARNING, ERROR)
            message: Primary log message
            **context: Additional context key-value pairs
            
        Returns:
            Formatted log string
        """
        # Add standard context
        ctx = {
            'run_id': self.run_id,
            'level': level,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            **context
        }
        
        if self.log_json:
            return json.dumps(ctx)
        else:
            # Key-value format
            kv_pairs = [f"{k}={v}" for k, v in ctx.items()]
            return ' '.join(kv_pairs)
    
    def info(self, message: str, **context):
        """Log informational message (start/stop, counts, durations)."""
        self.logger.info(self._format_message('INFO', message, **context))
    
    def debug(self, message: str, **context):
        """Log debug message (per-entry details, URLs, file paths)."""
        self.logger.debug(self._format_message('DEBUG', message, **context))
    
    def warning(self, message: str, **context):
        """Log warning message (recoverable issues)."""
        self.logger.warning(self._format_message('WARNING', message, **context))
    
    def error(self, message: str, **context):
        """Log error message (failures with actionable context)."""
        self.logger.error(self._format_message('ERROR', message, **context))
    
    def log_start(self, scope: str, total_entries: int, **context):
        """Log ingestion start with configuration summary."""
        self.info(
            'Ingestion started',
            scope=scope,
            total_entries=total_entries,
            **context
        )
    
    def log_progress(self, current: int, total: int, entity_type: str, **context):
        """Log progress through entity processing."""
        pct = (current / total * 100) if total > 0 else 0
        self.info(
            'Processing progress',
            entity_type=entity_type,
            current=current,
            total=total,
            percent=f"{pct:.1f}%",
            **context
        )
    
    def log_batch_complete(self, entity_type: str, batch_size: int, duration_s: float, **context):
        """Log completion of a batch write."""
        rate = batch_size / duration_s if duration_s > 0 else 0
        self.info(
            'Batch completed',
            entity_type=entity_type,
            batch_size=batch_size,
            duration_s=f"{duration_s:.2f}",
            rate_per_s=f"{rate:.1f}",
            **context
        )
    
    def log_complete(self, 
                     watersheds: int = 0,
                     subcatchments: int = 0, 
                     channels: int = 0,
                     **context):
        """Log ingestion completion with summary statistics."""
        duration_s = time.time() - self.start_time
        self.info(
            'Ingestion completed',
            watersheds=watersheds,
            subcatchments=subcatchments,
            channels=channels,
            total_duration_s=f"{duration_s:.2f}",
            **context
        )
    
    def log_fetch_start(self, url: str, correlation_id: str, **context):
        """Log start of URL fetch operation."""
        self.debug(
            'Fetching data',
            url=url,
            correlation_id=correlation_id,
            **context
        )
    
    def log_fetch_complete(self, url: str, correlation_id: str, duration_s: float, **context):
        """Log successful fetch completion."""
        self.debug(
            'Fetch completed',
            url=url,
            correlation_id=correlation_id,
            duration_s=f"{duration_s:.3f}",
            **context
        )
    
    def log_fetch_retry(self, url: str, correlation_id: str, attempt: int, max_attempts: int, error: str):
        """Log fetch retry attempt."""
        self.warning(
            'Fetch retry',
            url=url,
            correlation_id=correlation_id,
            attempt=attempt,
            max_attempts=max_attempts,
            error=str(error)
        )
    
    def log_fetch_failed(self, url: str, correlation_id: str, error: str):
        """Log permanent fetch failure."""
        self.error(
            'Fetch failed',
            url=url,
            correlation_id=correlation_id,
            error=str(error),
            action='Check URL accessibility and network connectivity'
        )
