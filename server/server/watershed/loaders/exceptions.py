"""
Custom exceptions for the data loading pipeline.

These exceptions provide specific error types for different failure modes,
enabling proper error handling without sys.exit() calls.
"""


class DataLoadError(Exception):
    """Base exception for all data loading errors."""
    pass


class DataSourceError(DataLoadError):
    """Raised when a data source cannot be accessed."""
    
    def __init__(self, message: str, url: str | None = None, runid: str | None = None):
        self.url = url
        self.runid = runid
        super().__init__(message)
