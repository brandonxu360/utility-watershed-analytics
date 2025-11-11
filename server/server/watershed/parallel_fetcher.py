"""
Parallel fetcher for remote data sources.

Provides bounded concurrency for URL fetches with retry logic,
while ensuring GDAL/OGR operations remain safe.
"""
import time
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, List, Optional, Tuple, Any
from dataclasses import dataclass
from django.contrib.gis.gdal import DataSource

from server.watershed.ingestion_logger import IngestionLogger


@dataclass
class FetchResult:
    """Result of a fetch operation."""
    correlation_id: str
    url: str
    success: bool
    data_source: Optional[DataSource] = None
    error: Optional[str] = None
    duration_s: float = 0.0
    attempts: int = 1


class ParallelFetcher:
    """
    Fetches data from URLs with bounded parallelism and retry logic.
    
    Uses ThreadPoolExecutor for IO-bound network fetches while keeping
    GDAL DataSource creation within the same thread to avoid concurrency issues.
    """
    
    RETRY_ATTEMPTS = 6
    BASE_DELAY_S = 0.2
    
    def __init__(self, max_workers: int = 4, logger: Optional[IngestionLogger] = None):
        """
        Initialize the parallel fetcher.
        
        Args:
            max_workers: Maximum number of concurrent fetch operations
            logger: IngestionLogger instance for structured logging
        """
        self.max_workers = max_workers
        self.logger = logger or IngestionLogger(__name__)
    
    @staticmethod
    def _sleep_backoff(attempt: int):
        """Sleep with exponential backoff: 0.2, 0.4, 0.8, 1.6, 3.2, 6.4s"""
        time.sleep(ParallelFetcher.BASE_DELAY_S * (2 ** attempt))
    
    def _fetch_single(self, url: str, correlation_id: str) -> FetchResult:
        """
        Fetch a single URL with retry logic.
        
        Args:
            url: URL to fetch
            correlation_id: Unique identifier for tracking this fetch
            
        Returns:
            FetchResult with success status and data or error
        """
        start_time = time.time()
        last_error = None
        
        self.logger.log_fetch_start(url, correlation_id)
        
        for attempt in range(self.RETRY_ATTEMPTS):
            try:
                # DataSource creation happens in this thread to keep GDAL operations isolated
                ds = DataSource(url)
                duration = time.time() - start_time
                
                self.logger.log_fetch_complete(url, correlation_id, duration)
                
                return FetchResult(
                    correlation_id=correlation_id,
                    url=url,
                    success=True,
                    data_source=ds,
                    duration_s=duration,
                    attempts=attempt + 1
                )
            except Exception as e:
                last_error = e
                if attempt < self.RETRY_ATTEMPTS - 1:
                    self.logger.log_fetch_retry(
                        url, 
                        correlation_id, 
                        attempt + 1, 
                        self.RETRY_ATTEMPTS, 
                        str(e)
                    )
                    self._sleep_backoff(attempt)
        
        # All retries exhausted
        duration = time.time() - start_time
        self.logger.log_fetch_failed(url, correlation_id, str(last_error))
        
        return FetchResult(
            correlation_id=correlation_id,
            url=url,
            success=False,
            error=str(last_error),
            duration_s=duration,
            attempts=self.RETRY_ATTEMPTS
        )
    
    def fetch_parallel(self, urls: List[str]) -> List[FetchResult]:
        """
        Fetch multiple URLs in parallel with bounded concurrency.
        
        Args:
            urls: List of URLs to fetch
            
        Returns:
            List of FetchResult objects in the same order as input URLs
        """
        if not urls:
            return []
        
        # Generate correlation IDs for tracking
        url_to_correlation = {url: f"fetch_{uuid.uuid4().hex[:8]}" for url in urls}
        
        # Preserve input order in results
        results_map = {}
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all fetch tasks
            future_to_url = {
                executor.submit(self._fetch_single, url, url_to_correlation[url]): url
                for url in urls
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    result = future.result()
                    results_map[url] = result
                except Exception as e:
                    # Shouldn't happen since _fetch_single catches everything,
                    # but handle just in case
                    self.logger.error(
                        'Unexpected fetch error',
                        url=url,
                        error=str(e)
                    )
                    results_map[url] = FetchResult(
                        correlation_id=url_to_correlation[url],
                        url=url,
                        success=False,
                        error=f"Unexpected error: {e}"
                    )
        
        # Return results in original order
        return [results_map[url] for url in urls]
    
    def fetch_sequential(self, urls: List[str]) -> List[FetchResult]:
        """
        Fetch URLs sequentially (no parallelism).
        
        Useful for debugging or when parallel fetching isn't desired.
        
        Args:
            urls: List of URLs to fetch
            
        Returns:
            List of FetchResult objects in the same order as input URLs
        """
        results = []
        for url in urls:
            correlation_id = f"fetch_{uuid.uuid4().hex[:8]}"
            result = self._fetch_single(url, correlation_id)
            results.append(result)
        return results
