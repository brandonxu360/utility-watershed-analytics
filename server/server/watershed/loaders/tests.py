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
from server.watershed.loaders.discovery import (
    WatershedDataDiscovery, StandaloneRunDiscovery, DataSource, UrlTemplates,
    normalize_runid,
)
from server.watershed.loaders.config import (
    LoaderConfig, RetryConfig, ApiConfig, GeometryConfig,
    BatchConfig, StandaloneRunConfig,
)
from server.watershed.loaders.readers import RemoteDataSourceReader


# =============================================================================
# Mock Implementations
# =============================================================================

class MockDataSourceReader:
    """Mock implementation of DataSourceReader for testing."""
    
    def __init__(self):
        self.geojson_responses: dict[str, Mock] = {}
        self.parquet_responses: dict[str, pd.DataFrame] = {}
        self.geojson_calls: list[tuple[str, Optional[Path], Optional[dict]]] = []
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
            
            mock_geom = Mock()
            mock_geos = Mock()
            mock_geos.__class__.__name__ = 'Polygon'
            mock_geom.geos = mock_geos
            mock_feature.geom = mock_geom
            
            mock_features.append(mock_feature)
        return mock_features
    
    def read_geojson(
        self,
        url: str,
        local_path: Optional[Path] = None,
        headers: Optional[dict] = None,
    ):
        """Return pre-configured mock response."""
        self.geojson_calls.append((url, local_path, headers))
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
    """Mock implementation of DataWriter for testing."""
    
    def __init__(self):
        self.saved_watersheds: list = []
        self.saved_subcatchments: dict[str, list] = {}
        self.saved_channels: dict[str, list] = {}
        self.updated_subcatchments: dict[str, dict] = {}
        self.saved_standalone_watersheds: list[dict] = []
    
    def save_watersheds(self, layer) -> int:
        count = 0
        for feature in layer:
            self.saved_watersheds.append(feature)
            count += 1
        return count
    
    def save_watersheds_filtered(self, layer, runids: set[str]) -> int:
        count = 0
        for feature in layer:
            runid = feature.get('runid')
            if runid in runids:
                self.saved_watersheds.append(feature)
                count += 1
        return count
    
    def save_standalone_watershed(self, layer, runid: str, display_name: str) -> int:
        count = 0
        for feature in layer:
            self.saved_standalone_watersheds.append({
                'feature': feature,
                'runid': runid,
                'display_name': display_name,
            })
            count += 1
        return count
    
    def save_subcatchments(self, runid: str, layer) -> int:
        features = list(layer)
        self.saved_subcatchments[runid] = features
        return len(features)
    
    def save_channels(self, runid: str, layer) -> int:
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
        self.updated_subcatchments[runid] = {
            'hillslopes': hillslopes,
            'soils': soils,
            'landuse': landuse,
        }
        count = 0
        if hillslopes is not None:
            count = max(count, len(hillslopes))
        if soils is not None:
            count = max(count, len(soils))
        if landuse is not None:
            count = max(count, len(landuse))
        return count


class MockDiscovery:
    """Mock implementation of WatershedDataDiscovery for testing."""
    
    WATERSHEDS_URL = "https://mock.test/watersheds.geojson"
    
    def __init__(self, runids: list[str] = None, jwt_token: Optional[str] = None):
        self.runids = runids or ["test-runid-1", "test-runid-2"]
        self.jwt_token = jwt_token
        self.config = self._create_test_config()
    
    def _create_test_config(self):
        return LoaderConfig(
            retry=RetryConfig(max_attempts=1, base_delay_seconds=0.01),
            api=ApiConfig(
                weppcloud_base_url="https://mock.test",
                batches=[BatchConfig(batch_url="https://mock.test/batch/test")],
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
        self.reader = MockDataSourceReader()
        self.writer = MockDataWriter()
        self.discovery = MockDiscovery(runids=["ws-1", "ws-2"])
        
        self._configure_watershed_response()
        self._configure_subcatchment_responses()
        self._configure_channel_responses()
        self._configure_parquet_responses()
    
    def _configure_watershed_response(self):
        self.reader.add_geojson_response(
            MockDiscovery.WATERSHEDS_URL,
            [
                {"runid": "ws-1", "PWS_ID": "123", "PWS_Name": "Test 1"},
                {"runid": "ws-2", "PWS_ID": "456", "PWS_Name": "Test 2"},
            ]
        )
    
    def _configure_subcatchment_responses(self):
        for runid in ["ws-1", "ws-2"]:
            self.reader.add_geojson_response(
                f"https://mock.test/runs/{runid}/subcatchments.geojson",
                [
                    {"TopazID": 1, "WeppID": 101},
                    {"TopazID": 2, "WeppID": 102},
                ]
            )
    
    def _configure_channel_responses(self):
        for runid in ["ws-1", "ws-2"]:
            self.reader.add_geojson_response(
                f"https://mock.test/runs/{runid}/channels.geojson",
                [
                    {"TopazID": 1, "WeppID": 101, "Order": 1},
                ]
            )
    
    def _configure_parquet_responses(self):
        for runid in ["ws-1", "ws-2"]:
            self.reader.add_parquet_response(
                f"https://mock.test/runs/{runid}/hillslopes.parquet",
                pd.DataFrame({
                    "TopazID": [1, 2],
                    "slope_scalar": [0.5, 0.6],
                    "length": [100.0, 200.0],
                })
            )
            self.reader.add_parquet_response(
                f"https://mock.test/runs/{runid}/soils.parquet",
                pd.DataFrame({
                    "TopazID": [1, 2],
                    "mukey": ["123", "456"],
                    "clay": [10.0, 15.0],
                })
            )
            self.reader.add_parquet_response(
                f"https://mock.test/runs/{runid}/landuse.parquet",
                pd.DataFrame({
                    "TopazID": [1, 2],
                    "key": [1, 2],
                    "cancov": [0.8, 0.9],
                })
            )
    
    def test_load_calls_reader_for_watersheds(self):
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        watershed_calls = [c for c in self.reader.geojson_calls if "watersheds" in c[0]]
        self.assertEqual(len(watershed_calls), 1)
    
    def test_load_calls_reader_for_subcatchments(self):
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        subcatchment_calls = [c for c in self.reader.geojson_calls if "subcatchments" in c[0]]
        self.assertEqual(len(subcatchment_calls), 2)
    
    def test_load_calls_writer_for_watersheds(self):
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        self.assertEqual(len(self.writer.saved_watersheds), 2)
    
    def test_load_calls_writer_for_subcatchments(self):
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        self.assertIn("ws-1", self.writer.saved_subcatchments)
        self.assertIn("ws-2", self.writer.saved_subcatchments)
    
    def test_load_updates_from_parquet(self):
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        self.assertIn("ws-1", self.writer.updated_subcatchments)
        self.assertIn("ws-2", self.writer.updated_subcatchments)
        
        ws1_updates = self.writer.updated_subcatchments["ws-1"]
        self.assertIsNotNone(ws1_updates["hillslopes"])
        self.assertIsNotNone(ws1_updates["soils"])
        self.assertIsNotNone(ws1_updates["landuse"])
    
    def test_load_returns_statistics(self):
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
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
        )
        
        loader.load(runids=["ws-1"], verbose=False)
        
        subcatchment_calls = [c for c in self.reader.geojson_calls if "subcatchments" in c[0]]
        self.assertEqual(len(subcatchment_calls), 1)
        self.assertIn("ws-1", subcatchment_calls[0][0])
    
    def test_jwt_token_sends_bearer_header_for_watersheds(self):
        """JWT token on the discovery is forwarded as a Bearer header."""
        token = "test-jwt-secret"
        # JWT lives on the discovery instance (per-batch), not on the loader config.
        discovery = MockDiscovery(runids=["ws-1", "ws-2"], jwt_token=token)

        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        watershed_calls = [c for c in self.reader.geojson_calls if "watersheds" in c[0]]
        self.assertEqual(len(watershed_calls), 1)
        _, _, headers = watershed_calls[0]
        self.assertEqual(headers, {"Authorization": f"Bearer {token}"})
    
    def test_no_jwt_token_sends_no_auth_header(self):
        """Without a JWT token, no Authorization header is sent."""
        discovery = MockDiscovery(runids=["ws-1", "ws-2"], jwt_token=None)

        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=discovery,
        )
        
        loader.load(runids=["ws-1", "ws-2"], verbose=False)
        
        watershed_calls = [c for c in self.reader.geojson_calls if "watersheds" in c[0]]
        self.assertEqual(len(watershed_calls), 1)
        _, _, headers = watershed_calls[0]
        self.assertIsNone(headers)


class TestStandaloneLoader(unittest.TestCase):
    """Test WatershedLoader with standalone run configuration."""

    def setUp(self):
        self.reader = MockDataSourceReader()
        self.writer = MockDataWriter()
        self.standalone_config = StandaloneRunConfig(
            runid="standalone;;test-run;;test-watershed",
            display_name="Test Watershed",
            run_base_url="https://mock.test/runs/test-run/config_wbt",
            boundary_url="https://mock.test/runs/test-run/config_wbt/download/dem/wbt/bound.geojson",
        )
        self.discovery = MockDiscovery(
            runids=["standalone;;test-run;;test-watershed"]
        )
        self.discovery.WATERSHEDS_URL = self.standalone_config.boundary_url

        self.reader.add_geojson_response(
            self.standalone_config.boundary_url,
            [{"ID": 0}],
        )
        runid = self.standalone_config.runid
        self.reader.add_geojson_response(
            f"https://mock.test/runs/{runid}/subcatchments.geojson",
            [{"TopazID": 1, "WeppID": 101}],
        )
        self.reader.add_geojson_response(
            f"https://mock.test/runs/{runid}/channels.geojson",
            [{"TopazID": 1, "WeppID": 101, "Order": 1}],
        )
        for dt in ["hillslopes", "soils", "landuse"]:
            self.reader.add_parquet_response(
                f"https://mock.test/runs/{runid}/{dt}.parquet",
                pd.DataFrame({"TopazID": [1]}),
            )

    def test_standalone_load_calls_save_standalone_watershed(self):
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
            standalone_config=self.standalone_config,
        )

        loader.load(
            runids=[self.standalone_config.runid],
            verbose=False,
        )

        self.assertEqual(len(self.writer.saved_standalone_watersheds), 1)
        saved = self.writer.saved_standalone_watersheds[0]
        self.assertEqual(saved['runid'], self.standalone_config.runid)
        self.assertEqual(saved['display_name'], "Test Watershed")

    def test_standalone_load_does_not_call_batch_save(self):
        loader = WatershedLoader(
            reader=self.reader,
            writer=self.writer,
            discovery=self.discovery,
            standalone_config=self.standalone_config,
        )

        loader.load(
            runids=[self.standalone_config.runid],
            verbose=False,
        )

        self.assertEqual(len(self.writer.saved_watersheds), 0)


class TestDiscoveryUrlGeneration(unittest.TestCase):
    """Test WatershedDataDiscovery URL generation."""
    
    def setUp(self):
        self.batch_config = BatchConfig(
            batch_url="https://test.example.com/weppcloud/batch/nasa-roses-2026-sbs",
        )
        self.config = LoaderConfig(
            api=ApiConfig(
                weppcloud_base_url="https://test.example.com/weppcloud",
                batches=[self.batch_config],
            ),
        )
        self.victoria_batch_config = BatchConfig(
            batch_url="https://test.example.com/weppcloud/batch/victoria-ca-2026-sbs",
        )
        self.victoria_config = LoaderConfig(
            api=ApiConfig(
                weppcloud_base_url="https://test.example.com/weppcloud",
                batches=[self.victoria_batch_config],
            ),
        )
    
    def test_get_urls_for_runid_short_format(self):
        discovery = WatershedDataDiscovery(
            config=self.config, batch_config=self.batch_config
        )
        
        urls = discovery.get_urls_for_runid("batch;;nasa-roses-2026-sbs;;OR-20")
        
        self.assertIn("subcatchments", urls)
        self.assertIn("channels", urls)
        self.assertIn("hillslopes", urls)
        self.assertIn("soils", urls)
        self.assertIn("landuse", urls)
        
        expected_base = "https://test.example.com/weppcloud/runs/batch;;nasa-roses-2026-sbs;;OR-20/disturbed_wbt"
        self.assertTrue(urls["subcatchments"].startswith(expected_base))
    
    def test_get_urls_for_runid_full_format(self):
        discovery = WatershedDataDiscovery(
            config=self.config, batch_config=self.batch_config
        )
        
        urls = discovery.get_urls_for_runid("batch;;nasa-roses-2026-sbs;;or-20")
        
        expected_base = "https://test.example.com/weppcloud/runs/batch;;nasa-roses-2026-sbs;;OR-20/disturbed_wbt"
        self.assertTrue(urls["subcatchments"].startswith(expected_base))
    
    def test_custom_url_templates(self):
        custom_templates = UrlTemplates(
            subcatchments="{weppcloud_base}/custom/{runid}/sub.geojson",
        )
        discovery = WatershedDataDiscovery(
            config=self.config,
            batch_config=self.batch_config,
            templates=custom_templates,
        )
        
        urls = discovery.get_urls_for_runid("batch;;nasa-roses-2026-sbs;;or-10")
        
        self.assertIn("/custom/batch;;nasa-roses-2026-sbs;;OR-10/sub.geojson", urls["subcatchments"])

    def test_watersheds_filename_derived_from_nasa_roses_batch_url(self):
        """Watersheds filename is derived from the nasa-roses batch URL."""
        discovery = WatershedDataDiscovery(
            config=self.config, batch_config=self.batch_config
        )
        self.assertEqual(discovery.watersheds_filename, "nasa-roses-2026-sbs_completed.geojson")

    def test_watersheds_filename_derived_from_victoria_batch_url(self):
        """Watersheds filename is derived from the victoria batch URL."""
        discovery = WatershedDataDiscovery(
            config=self.victoria_config, batch_config=self.victoria_batch_config
        )
        self.assertEqual(discovery.watersheds_filename, "victoria-ca-2026-sbs_completed.geojson")

    def test_watersheds_filename_override_used_for_filename_and_url(self):
        """BatchConfig.watersheds_filename override takes precedence over the derived name."""
        custom_filename = "WWS_Watersheds_HUC10_psbs_030426.geojson"
        batch_config = BatchConfig(
            batch_url="https://test.example.com/weppcloud/batch/nasa-roses-2026-sbs",
            watersheds_filename=custom_filename,
        )
        config = LoaderConfig(
            api=ApiConfig(
                weppcloud_base_url="https://test.example.com/weppcloud",
                batches=[batch_config],
            ),
        )
        discovery = WatershedDataDiscovery(config=config, batch_config=batch_config)

        self.assertEqual(discovery.watersheds_filename, custom_filename)
        self.assertEqual(
            discovery.watersheds_url,
            f"https://test.example.com/weppcloud/batch/nasa-roses-2026-sbs/download/resources/{custom_filename}",
        )

    def test_victoria_get_urls_preserves_mixed_case_runid(self):
        """URL generation for victoria batch preserves mixed-case run IDs."""
        discovery = WatershedDataDiscovery(
            config=self.victoria_config, batch_config=self.victoria_batch_config
        )

        urls = discovery.get_urls_for_runid("batch;;victoria-ca-2026-sbs;;Leech")

        expected_base = "https://test.example.com/weppcloud/runs/batch;;victoria-ca-2026-sbs;;Leech/disturbed_wbt"
        self.assertTrue(urls["subcatchments"].startswith(expected_base))

    def test_victoria_sooke_runid_not_uppercased(self):
        """Victoria Sooke## run IDs are not uppercased in generated URLs."""
        discovery = WatershedDataDiscovery(
            config=self.victoria_config, batch_config=self.victoria_batch_config
        )

        urls = discovery.get_urls_for_runid("batch;;victoria-ca-2026-sbs;;Sooke01")

        self.assertIn("Sooke01", urls["subcatchments"])
        self.assertNotIn("SOOKE01", urls["subcatchments"])


class TestStandaloneRunDiscovery(unittest.TestCase):
    """Test StandaloneRunDiscovery URL generation."""

    def setUp(self):
        self.standalone_config = StandaloneRunConfig(
            runid="aversive-forestry",
            display_name="Gate Creek",
            run_base_url="https://wepp.cloud/weppcloud/runs/aversive-forestry/disturbed9002_wbt",
            boundary_url="https://wepp.cloud/weppcloud/runs/aversive-forestry/disturbed9002_wbt/download/dem/wbt/bound.geojson",
        )
        self.config = LoaderConfig(
            api=ApiConfig(
                weppcloud_base_url="https://wepp.cloud/weppcloud",
                batches=[],
                standalone_runs=[self.standalone_config],
            ),
        )
        self.discovery = StandaloneRunDiscovery(self.standalone_config, self.config)

    def test_discover_runids_returns_single_runid(self):
        runids = self.discovery.discover_runids()
        self.assertEqual(runids, ["aversive-forestry"])

    def test_get_watersheds_url_returns_boundary(self):
        self.assertEqual(
            self.discovery.get_watersheds_url(),
            self.standalone_config.boundary_url,
        )

    def test_get_urls_for_runid(self):
        urls = self.discovery.get_urls_for_runid(self.standalone_config.runid)
        base = "https://wepp.cloud/weppcloud/runs/aversive-forestry/disturbed9002_wbt/download"
        self.assertEqual(urls["subcatchments"], f"{base}/dem/wbt/subcatchments.WGS.geojson")
        self.assertEqual(urls["channels"], f"{base}/dem/wbt/channels.WGS.geojson")
        self.assertEqual(urls["hillslopes"], f"{base}/watershed/hillslopes.parquet")
        self.assertEqual(urls["soils"], f"{base}/soils/soils.parquet")
        self.assertEqual(urls["landuse"], f"{base}/landuse/landuse.parquet")

    def test_iter_subcatchments_yields_correct_source(self):
        sources = list(self.discovery.iter_subcatchments())
        self.assertEqual(len(sources), 1)
        self.assertEqual(sources[0].name, self.standalone_config.runid)
        self.assertIn("subcatchments.WGS.geojson", sources[0].url)

    def test_iter_sources_filters_by_runid(self):
        sources = list(self.discovery.iter_sources(
            "subcatchments", runids=["nonexistent-runid"]
        ))
        self.assertEqual(len(sources), 0)


class TestStandaloneRunConfig(unittest.TestCase):
    """Test StandaloneRunConfig URL generation."""

    def test_get_data_urls(self):
        config = StandaloneRunConfig(
            runid="standalone;;test;;watershed",
            display_name="Test",
            run_base_url="https://example.com/runs/test/config_wbt",
            boundary_url="https://example.com/runs/test/config_wbt/download/dem/wbt/bound.geojson",
        )
        urls = config.get_data_urls()
        self.assertEqual(urls["boundary"], config.boundary_url)
        self.assertEqual(
            urls["subcatchments"],
            "https://example.com/runs/test/config_wbt/download/dem/wbt/subcatchments.WGS.geojson",
        )
        self.assertEqual(
            urls["soils"],
            "https://example.com/runs/test/config_wbt/download/soils/soils.parquet",
        )


class TestRunidNormalization(unittest.TestCase):
    """Test runid normalization across batch types."""

    def test_nasa_roses_uppercased(self):
        self.assertEqual(
            normalize_runid("batch;;nasa-roses-2026-sbs;;or-20"),
            "batch;;nasa-roses-2026-sbs;;OR-20",
        )

    def test_nasa_roses_already_uppercase(self):
        self.assertEqual(
            normalize_runid("batch;;nasa-roses-2026-sbs;;OR-20"),
            "batch;;nasa-roses-2026-sbs;;OR-20",
        )

    def test_standalone_preserved(self):
        self.assertEqual(
            normalize_runid("aversive-forestry"),
            "aversive-forestry",
        )

    def test_non_nasa_roses_batch_preserved(self):
        self.assertEqual(
            normalize_runid("batch;;victoria-ca-2026-sbs;;Leech"),
            "batch;;victoria-ca-2026-sbs;;Leech",
        )


class TestProtocolConformance(unittest.TestCase):
    """Test that implementations conform to protocols."""
    
    def test_mock_reader_is_data_source_reader(self):
        reader = MockDataSourceReader()
        self.assertTrue(isinstance(reader, DataSourceReader))
    
    def test_mock_writer_is_data_writer(self):
        writer = MockDataWriter()
        self.assertTrue(isinstance(writer, DataWriter))
    
    def test_remote_reader_is_data_source_reader(self):
        reader = RemoteDataSourceReader()
        self.assertTrue(isinstance(reader, DataSourceReader))


class TestReaderLocalCachePreference(unittest.TestCase):
    """Test that readers prefer local cache over remote."""
    
    def test_mock_reader_tracks_local_path(self):
        reader = MockDataSourceReader()
        reader.add_geojson_response("https://test.com/data.geojson", [])
        
        local_path = Path("/cache/data.geojson")
        reader.read_geojson("https://test.com/data.geojson", local_path)
        
        self.assertEqual(reader.geojson_calls[0][1], local_path)


class TestParquetFieldMapping(unittest.TestCase):
    """Test parquet field mapping logic."""
    
    def test_hillslopes_columns_mapped(self):
        df = pd.DataFrame({
            "TopazID": [1, 2],
            "slope_scalar": [0.5, 0.6],
            "length": [100.0, 200.0],
            "width": [50.0, 60.0],
            "area": [5000, 12000],
        })
        
        self.assertIn("slope_scalar", df.columns)
        self.assertIn("area", df.columns)
    
    def test_soils_columns_mapped(self):
        df = pd.DataFrame({
            "TopazID": [1],
            "mukey": ["123"],
            "fname": ["soil.sol"],
            "clay": [10.0],
        })
        
        self.assertIn("fname", df.columns)  # parquet column name


class TestRunidConversion(unittest.TestCase):
    """Test runid conversion utilities (legacy class, see also TestRunidNormalization)."""

    def test_normalize_runid_from_lowercase(self):
        """Defensive uppercase conversion for nasa-roses batch."""
        normalized = normalize_runid("batch;;nasa-roses-2026-sbs;;or-20")
        self.assertEqual(normalized, "batch;;nasa-roses-2026-sbs;;OR-20")

    def test_normalize_runid_already_uppercase(self):
        """Correctly formatted nasa-roses runids are unchanged."""
        normalized = normalize_runid("batch;;nasa-roses-2026-sbs;;OR-20")
        self.assertEqual(normalized, "batch;;nasa-roses-2026-sbs;;OR-20")

    def test_normalize_runid_victoria_preserves_case(self):
        """Victoria mixed-case run IDs are NOT uppercased."""
        normalized = normalize_runid("batch;;victoria-ca-2026-sbs;;Leech")
        self.assertEqual(normalized, "batch;;victoria-ca-2026-sbs;;Leech")

    def test_normalize_runid_victoria_sooke_preserves_case(self):
        """Victoria Sooke## run IDs (mixed-case) are preserved."""
        normalized = normalize_runid("batch;;victoria-ca-2026-sbs;;Sooke01")
        self.assertEqual(normalized, "batch;;victoria-ca-2026-sbs;;Sooke01")


if __name__ == "__main__":
    unittest.main()
