"""
Unit tests for ingestion configuration.
"""
import os
from unittest import mock
from django.test import TestCase, override_settings

from server.watershed.ingestion_config import get_ingestion_config, get_manifest_path


class IngestionConfigTests(TestCase):
    """Test configuration loading and environment awareness."""
    
    @override_settings(DEBUG=True)
    def test_auto_scope_resolves_to_dev_subset_in_debug(self):
        """In DEBUG mode, auto scope should resolve to dev_subset."""
        config = get_ingestion_config()
        self.assertEqual(config['SCOPE'], 'dev_subset')
    
    @override_settings(DEBUG=False)
    def test_auto_scope_resolves_to_all_in_production(self):
        """In production mode, auto scope should resolve to all."""
        config = get_ingestion_config()
        self.assertEqual(config['SCOPE'], 'all')
    
    def test_default_values(self):
        """Check default configuration values."""
        config = get_ingestion_config()
        
        self.assertEqual(config['MODE'], 'url')
        self.assertEqual(config['MAX_WORKERS'], 4)
        self.assertEqual(config['BATCH_SIZE'], 500)
        self.assertEqual(config['SUBSET_SIZE'], 50)
        self.assertFalse(config['LOG_JSON'])
        self.assertEqual(config['DOWNLOAD_DIR'], '/tmp/ingestion')
    
    @override_settings(INGESTION={
        'MODE': 'download',
        'MAX_WORKERS': 8,
        'BATCH_SIZE': 1000,
        'SCOPE': 'all',
        'LOG_JSON': True
    })
    def test_settings_override(self):
        """User settings in settings.py should override defaults."""
        config = get_ingestion_config()
        
        self.assertEqual(config['MODE'], 'download')
        self.assertEqual(config['MAX_WORKERS'], 8)
        self.assertEqual(config['BATCH_SIZE'], 1000)
        self.assertEqual(config['SCOPE'], 'all')
        self.assertTrue(config['LOG_JSON'])
    
    def test_manifest_path_resolution(self):
        """get_manifest_path should return absolute path to manifest."""
        path = get_manifest_path()
        
        self.assertTrue(path.is_absolute())
        self.assertTrue(str(path).endswith('data-manifest.yaml'))
