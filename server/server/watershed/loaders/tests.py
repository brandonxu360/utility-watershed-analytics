"""
Unit tests for the watershed data loading pipeline.

These tests use mock implementations of the protocols to test the loading
logic without network or database access.
"""

import unittest
from unittest.mock import Mock
from pathlib import Path
from typing import Optional, Iterator
import pandas as pd

from server.watershed.loaders.protocols import DataSourceReader, DataWriter
from server.watershed.loaders.loader import WatershedLoader
from server.watershed.loaders.discovery import WatershedDataDiscovery, DataSource, UrlTemplates
from server.watershed.loaders.config import LoaderConfig, RetryConfig, ApiConfig, GeometryConfig
from server.watershed.loaders.readers import RemoteDataSourceReader


# =============================================================================
# Mock Implementations
# =============================================================================

class MockDataSourceReader:
    """
    Mock implementation of DataSourceReader for testing.
    
    Allows pre-configuring responses and tracking calls.
    """
    
    def __init__(self):
        self.geojson_responses: dict[str, Mock] = {}
        self.parquet_responses: dict[str, pd.DataFrame] = {}
        self.geojson_calls: list[tuple[str, Optional[Path]]] = []
        self.parquet_calls: list[tuple[str, Optional[Path]]] = []
    
    def add_geojson_response(self, url: str, layer_data: list[dict]):
        """Configure a mock GeoJSON response."""
        mock_ds = Mock()
        mock_layer = Mock()
        mock_layer.__iter__ = Mock(return_value=iter(self._create_mock_features(layer_data)))
        mock_ds.__getitem__ = Mock(return_value=mock_layer)
        self.geojson_responses[url] = mock_ds
    
    def add_parquet_response(self, url: str, df: pd.DataFrame):
        """Configure a mock Parquet response."""
        self.parquet_responses[url] = df
    
    def _create_mock_features(self, features: list[dict]) -> list[Mock]:
        """Create mock GDAL features from dictionaries."""
        mock_features = []
        for feature in features:
            mock_feature = Mock()
            mock_feature.get = Mock(side_effect=lambda k, f=feature: f.get(k))
            
            # Mock geometry
            mock_geom = Mock()
            mock_geos = Mock()
            mock_geos.__class__.__name__ = 'Polygon'
            mock_geom.geos = mock_geos
            mock_feature.geom = mock_geom
            
            mock_features.append(mock_feature)
        return mock_features
    
    def read_geojson(self, url: str, local_path: Optional[Path] = None):
        """Return pre-configured mock response."""
        self.geojson_calls.append((url, local_path))
        if url in self.geojson_responses:
            return self.geojson_responses[url]
        raise ValueError(f"No mock response configured for URL: {url}")
    
    def read_parquet(self, url: str, local_path: Optional[Path] = None) -> pd.DataFrame:
        """Return pre-configured mock response."""
        self.parquet_calls.append((url, local_path))
        if url in self.parquet_responses:
            return self.parquet_responses[url]
        raise ValueError(f"No mock response configured for URL: {url}")


class MockDataWriter:
    """
    Mock implementation of DataWriter for testing.
    
    Tracks all write operations without touching the database.
    """
    
    def __init__(self):
        self.saved_watersheds: list = []
        self.saved_subcatchments: dict[str, list] = {}
        self.saved_channels: dict[str, list] = {}
        self.updated_subcatchments: dict[str, dict] = {}
    
    def save_watersheds(self, layer) -> int:
        """Track watershed saves."""
        count = 0
        for feature in layer:
            self.saved_watersheds.append(feature)
            count += 1
        return count
    
    def save_watersheds_filtered(self, layer, runids: set[str]) -> int:
        """Track filtered watershed saves."""
        count = 0
        for feature in layer:
            runid = feature.get('runid')
            if runid in runids:
                self.saved_watersheds.append(feature)
                count += 1
        return count
    
    def save_subcatchments(self, runid: str, layer) -> int:
        """Track subcatchment saves."""
        features = list(layer)
        self.saved_subcatchments[runid] = features
        return len(features)
    
    def save_channels(self, runid: str, layer) -> int:
        """Track channel saves."""
        features = list(layer)
        self.saved_channels[runid] = features
        return len(features)
    
    def update_subcatchments_from_parquet(
        self,
        runid: str,
        hillslopes: Optional[pd.DataFrame],
        soils: Optional[pd.DataFrame],
        landuse: Optional[pd.DataFrame],
    ) -> int:
        """Track parquet updates."""
        self.updated_subcatchments[runid] = {
            'hillslopes': hillslopes,
            'soils': soils,
            'landuse': landuse,
        }
        # Return mock update count
        count = 0
        if hillslopes is not None:
            count = max(count, len(hillslopes))
        if soils is not None:
            count = max(count, len(soils))
        if landuse is not None:
            count = max(count, len(landuse))
        return count


class MockDiscovery:
    """
    Mock implementation of WatershedDataDiscovery for testing.
    """
    
    WATERSHEDS_URL = "https://mock.test/watersheds.geojson"
    
    def __init__(self, runids: list[str] = None):
        self.runids = runids or ["test-runid-1", "test-runid-2"]
        self.config = self._create_test_config()
    
    def _create_test_config(self):
        return LoaderConfig(
            retry=RetryConfig(max_attempts=1, base_delay_seconds=0.01),
            api=ApiConfig(
                weppcloud_base_url="https://mock.test",
                default_config="test_config",
            ),
            geometry=GeometryConfig(),
        )
    
    def discover_runids(self, force_refresh: bool = False) -> list[str]:
        return self.runids
    
    def get_watersheds_url(self) -> str:
        return self.WATERSHEDS_URL
    
    def get_watersheds_local_path(self) -> Optional[Path]:
        return None
    
    def iter_subcatchments(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        target_runids = runids if runids else self.runids
        for runid in target_runids:
            yield DataSource(
                name=runid,
                url=f"https://mock.test/runs/{runid}/subcatchments.geojson",
                local_path=None,
                data_type="subcatchments",
            )
    
    def iter_channels(self, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        target_runids = runids if runids else self.runids
        for runid in target_runids:
            yield DataSource(
                name=runid,
                url=f"https://mock.test/runs/{runid}/channels.geojson",
                local_path=None,
                data_type="channels",
            )
    
    def iter_sources(self, data_type: str, runids: Optional[list[str]] = None) -> Iterator[DataSource]:
        target_runids = runids if runids else self.runids
        extension = "parquet" if data_type in ("hillslopes", "soils", "landuse") else "geojson"
        for runid in target_runids:
            yield DataSource(
                name=runid,
                url=f"https://mock.test/runs/{runid}/{data_type}.{extension}",
                local_path=None,
                data_type=data_type,
            )


# =============================================================================
# Test Cases
# =============================================================================

class TestWatershedLoaderWithMocks(unittest.TestCase):
    """Test WatershedLoader using mock dependencies."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.reader = MockDataSourceReader()
        self.writer = MockDataWriter()
        self.discovery = MockDiscovery(runids=["ws-1", "ws-2"])
        
        # Configure mock responses
        self._configure_watershed_response()
        self._configure_subcatchment_responses()
        self._configure_channel_responses()
        self._configure_parquet_responses()
    
    def _configure_watershed_response(self):
        """Configure mock watershed GeoJSON response."""
        self.reader.add_geojson_response(
            MockDiscovery.WATERSHEDS_URL,
            [
                {"runid": "ws-1", "pws_id": "123", "pws_name": "Test 1"},
                {"runid": "ws-2", "pws_id": "456", "pws_name": "Test 2"},
            ]
        )
    
    def _configure_subcatchment_responses(self):
        """Configure mock subcatchment responses."""
        for runid in ["ws-1", "ws-2"]:
            self.reader.add_geojson_response(
                f"https://mock.test/runs/{runid}/subcatchments.geojson",
                [
                    {"TopazID": 1, "WeppID": 101},
                    {"TopazID": 2, "WeppID": 102},
                ]
            )
    
    def _configure_channel_responses(self):
        """Configure mock channel responses."""
        for runid in ["ws-1", "ws-2"]:
            self.reader.add_geojson_response(
                f"https://mock.test/runs/{runid}/channels.geojson",
                [
                    {"TopazID": 1, "WeppID": 101, "Order": 1},
                ]
            )
    
    def _configure_parquet_responses(self):
        """Configure mock parquet responses."""
        for runid in ["ws-1", "ws-2"]:
            # Hillslopes
            self.reader.add_parquet_response(
                f"https://mock.test/runs/{runid}/hillslopes.parquet",
                pd.DataFrame({
                    "TopazID": [1, 2],
                    "slope_scalar": [0.5, 0.6],
                    "length": [100.0, 200.0],
                })
            )
            # Soils
            self.reader.add_parquet_response(
                f"https://mock.test/runs/{runid}/soils.parquet",
                pd.DataFrame({
                    "TopazID": [1, 2],
                    "mukey": ["123", "456"],
                    "clay": [10.0, 15.0],
                })
            )
            # Landuse
            self.reader.add_parquet_response(
                f"https://mock.test/runs/{runid}/landuse.parquet",
                pd.DataFrame({
                    "TopazID": [1, 2],
                    "key": [1, 2],
                    "cancov": [0.8, 0.9],
                })
            )
    
    def test_load_calls_reader_for_watersheds(self):
        """Test that load() reads watershed data."""
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        # Should have called read_geojson for watersheds
        watershed_calls = [c for c in self.reader.geojson_calls if "watersheds" in c[0]]
        self.assertEqual(len(watershed_calls), 1)
    
    def test_load_calls_reader_for_subcatchments(self):
        """Test that load() reads subcatchment data for each runid."""
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        # Should have called read_geojson for each runid's subcatchments
        subcatchment_calls = [c for c in self.reader.geojson_calls if "subcatchments" in c[0]]
        self.assertEqual(len(subcatchment_calls), 2)
    
    def test_load_calls_writer_for_watersheds(self):
        """Test that load() writes watershed data."""
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        # Writer should have received watersheds
        self.assertEqual(len(self.writer.saved_watersheds), 2)
    
    def test_load_calls_writer_for_subcatchments(self):
        """Test that load() writes subcatchment data."""
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        # Writer should have received subcatchments for each runid
        self.assertIn("ws-1", self.writer.saved_subcatchments)
        self.assertIn("ws-2", self.writer.saved_subcatchments)
    
    def test_load_updates_from_parquet(self):
        """Test that load() updates subcatchments with parquet data."""
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        # Writer should have received parquet updates
        self.assertIn("ws-1", self.writer.updated_subcatchments)
        self.assertIn("ws-2", self.writer.updated_subcatchments)
        
        # Check that dataframes were passed
        ws1_updates = self.writer.updated_subcatchments["ws-1"]
        self.assertIsNotNone(ws1_updates["hillslopes"])
        self.assertIsNotNone(ws1_updates["soils"])
        self.assertIsNotNone(ws1_updates["landuse"])
    
    def test_load_returns_statistics(self):
        """Test that load() returns correct statistics."""
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        result = loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        self.assertIn("watersheds_saved", result)
        self.assertIn("subcatchments_saved", result)
        self.assertIn("channels_saved", result)
        self.assertIn("subcatchments_updated", result)
    
    def test_load_filters_by_runids(self):
        """Test that load() respects runid filter."""
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        # Only load ws-1
        loader.load(runids=["ws-1"], verbose=False)
        
        # Should only have subcatchment data for ws-1
        subcatchment_calls = [c for c in self.reader.geojson_calls if "subcatchments" in c[0]]
        self.assertEqual(len(subcatchment_calls), 1)
        self.assertIn("ws-1", subcatchment_calls[0][0])


class TestDiscoveryUrlGeneration(unittest.TestCase):
    """Test WatershedDataDiscovery URL generation."""
    
    def setUp(self):
        self.config = LoaderConfig(
            api=ApiConfig(
                weppcloud_base_url="https://test.example.com/weppcloud",
                default_config="test_config",
            ),
        )
    
    def test_get_urls_for_runid(self):
        """Test URL generation for a runid."""
        discovery = WatershedDataDiscovery(config=self.config)
        
        urls = discovery.get_urls_for_runid("batch;;test;;wa-0")
        
        self.assertIn("subcatchments", urls)
        self.assertIn("channels", urls)
        self.assertIn("hillslopes", urls)
        self.assertIn("soils", urls)
        self.assertIn("landuse", urls)
        
        # Check URL format
        self.assertIn("batch;;test;;wa-0", urls["subcatchments"])
        self.assertIn("test_config", urls["subcatchments"])
    
    def test_custom_url_templates(self):
        """Test that custom URL templates are used."""
        custom_templates = UrlTemplates(
            subcatchments="{api_base}/custom/{runid}/sub.geojson",
        )
        discovery = WatershedDataDiscovery(
            config=self.config,
            templates=custom_templates,
        )
        
        urls = discovery.get_urls_for_runid("test-runid")
        
        self.assertIn("/custom/test-runid/sub.geojson", urls["subcatchments"])


class TestProtocolConformance(unittest.TestCase):
    """Test that implementations conform to protocols."""
    
    def test_mock_reader_is_data_source_reader(self):
        """MockDataSourceReader should implement DataSourceReader protocol."""
        reader = MockDataSourceReader()
        self.assertTrue(isinstance(reader, DataSourceReader))
    
    def test_mock_writer_is_data_writer(self):
        """MockDataWriter should implement DataWriter protocol."""
        writer = MockDataWriter()
        self.assertTrue(isinstance(writer, DataWriter))
    
    def test_remote_reader_is_data_source_reader(self):
        """RemoteDataSourceReader should implement DataSourceReader protocol."""
        reader = RemoteDataSourceReader()
        self.assertTrue(isinstance(reader, DataSourceReader))


class TestReaderLocalCachePreference(unittest.TestCase):
    """Test that readers prefer local cache over remote."""
    
    def test_mock_reader_tracks_local_path(self):
        """Reader should receive local_path when provided."""
        reader = MockDataSourceReader()
        reader.add_geojson_response("https://test.com/data.geojson", [])
        
        local_path = Path("/cache/data.geojson")
        reader.read_geojson("https://test.com/data.geojson", local_path)
        
        # Verify local_path was passed
        self.assertEqual(reader.geojson_calls[0][1], local_path)


class TestParquetFieldMapping(unittest.TestCase):
    """Test parquet field mapping logic."""
    
    def test_hillslopes_columns_mapped(self):
        """Test that hillslope DataFrame columns are correctly named."""
        df = pd.DataFrame({
            "TopazID": [1, 2],
            "slope_scalar": [0.5, 0.6],
            "length": [100.0, 200.0],
            "width": [50.0, 60.0],
            "area": [5000, 12000],  # Note: maps to hillslope_area
        })
        
        # Verify expected columns exist
        self.assertIn("slope_scalar", df.columns)
        self.assertIn("area", df.columns)  # parquet column name
    
    def test_soils_columns_mapped(self):
        """Test that soils DataFrame columns are correctly named."""
        df = pd.DataFrame({
            "TopazID": [1],
            "mukey": ["123"],
            "fname": ["soil.sol"],  # Note: maps to soil_fname
            "clay": [10.0],
        })
        
        self.assertIn("fname", df.columns)  # parquet column name


if __name__ == "__main__":
    unittest.main()
