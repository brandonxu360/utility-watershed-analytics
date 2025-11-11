"""
Unit tests for ingestion logger.
"""
import json
import logging
from io import StringIO
from django.test import TestCase

from server.watershed.ingestion_logger import IngestionLogger


class IngestionLoggerTests(TestCase):
    """Test structured logging functionality."""
    
    def setUp(self):
        """Set up logger with captured output."""
        self.log_stream = StringIO()
        self.handler = logging.StreamHandler(self.log_stream)
        self.handler.setLevel(logging.DEBUG)
        
    def test_run_id_generation(self):
        """Should generate unique run IDs."""
        logger1 = IngestionLogger()
        logger2 = IngestionLogger()
        
        self.assertIsNotNone(logger1.run_id)
        self.assertIsNotNone(logger2.run_id)
        self.assertNotEqual(logger1.run_id, logger2.run_id)
    
    def test_custom_run_id(self):
        """Should accept custom run ID."""
        custom_id = 'test_run_123'
        logger = IngestionLogger(run_id=custom_id)
        
        self.assertEqual(logger.run_id, custom_id)
    
    def test_json_output_format(self):
        """With log_json=True, should emit valid JSON."""
        logger = IngestionLogger(log_json=True)
        logger.logger.addHandler(self.handler)
        logger.logger.setLevel(logging.INFO)
        
        logger.info('Test message', foo='bar')
        
        output = self.log_stream.getvalue()
        # Should be valid JSON
        log_data = json.loads(output.strip())
        
        self.assertEqual(log_data['level'], 'INFO')
        self.assertEqual(log_data['message'], 'Test message')
        self.assertEqual(log_data['foo'], 'bar')
        self.assertEqual(log_data['run_id'], logger.run_id)
    
    def test_key_value_output_format(self):
        """With log_json=False, should emit key-value pairs."""
        logger = IngestionLogger(log_json=False)
        logger.logger.addHandler(self.handler)
        logger.logger.setLevel(logging.INFO)
        
        logger.info('Test message', foo='bar', baz=123)
        
        output = self.log_stream.getvalue()
        
        self.assertIn('level=INFO', output)
        self.assertIn('message=Test message', output)
        self.assertIn('foo=bar', output)
        self.assertIn('baz=123', output)
        self.assertIn(f'run_id={logger.run_id}', output)
    
    def test_log_levels(self):
        """Should support different log levels."""
        logger = IngestionLogger(log_json=True)
        logger.logger.addHandler(self.handler)
        logger.logger.setLevel(logging.DEBUG)
        
        # Clear stream
        self.log_stream.truncate(0)
        self.log_stream.seek(0)
        
        logger.debug('Debug msg')
        logger.info('Info msg')
        logger.warning('Warning msg')
        logger.error('Error msg')
        
        output = self.log_stream.getvalue()
        lines = [line for line in output.strip().split('\n') if line]
        
        self.assertEqual(len(lines), 4)
        
        levels = [json.loads(line)['level'] for line in lines]
        self.assertEqual(levels, ['DEBUG', 'INFO', 'WARNING', 'ERROR'])
    
    def test_log_start(self):
        """log_start should include scope and entry count."""
        logger = IngestionLogger(log_json=True)
        logger.logger.addHandler(self.handler)
        logger.logger.setLevel(logging.INFO)
        
        logger.log_start(scope='dev_subset', total_entries=100, max_workers=4)
        
        output = self.log_stream.getvalue()
        log_data = json.loads(output.strip())
        
        self.assertEqual(log_data['message'], 'Ingestion started')
        self.assertEqual(log_data['scope'], 'dev_subset')
        self.assertEqual(log_data['total_entries'], 100)
        self.assertEqual(log_data['max_workers'], 4)
    
    def test_log_progress(self):
        """log_progress should calculate percentage."""
        logger = IngestionLogger(log_json=True)
        logger.logger.addHandler(self.handler)
        logger.logger.setLevel(logging.INFO)
        
        logger.log_progress(25, 100, 'subcatchments')
        
        output = self.log_stream.getvalue()
        log_data = json.loads(output.strip())
        
        self.assertEqual(log_data['current'], 25)
        self.assertEqual(log_data['total'], 100)
        self.assertEqual(log_data['percent'], '25.0%')
        self.assertEqual(log_data['entity_type'], 'subcatchments')
    
    def test_log_fetch_retry(self):
        """log_fetch_retry should include attempt numbers."""
        logger = IngestionLogger(log_json=True)
        logger.logger.addHandler(self.handler)
        logger.logger.setLevel(logging.WARNING)
        
        logger.log_fetch_retry(
            url='https://example.com/data.json',
            correlation_id='test_123',
            attempt=2,
            max_attempts=6,
            error='Connection timeout'
        )
        
        output = self.log_stream.getvalue()
        log_data = json.loads(output.strip())
        
        self.assertEqual(log_data['level'], 'WARNING')
        self.assertEqual(log_data['message'], 'Fetch retry')
        self.assertEqual(log_data['attempt'], 2)
        self.assertEqual(log_data['max_attempts'], 6)
