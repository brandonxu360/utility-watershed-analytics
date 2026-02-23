"""
Tests for the SBS (Soil Burn Severity) raster functionality.

Covers:
  - color_map module:  get_colormap(), get_render_colormap() and get_colormap_metadata()
  - SbsColormapView:   GET /api/watersheds/sbs/colormap
  - SbsRasterTileView: GET /api/watersheds/<runid>/sbs/tiles/<z>/<x>/<y>.png
"""

import unittest
from unittest.mock import patch, MagicMock

import rasterio.errors
from django.contrib.gis.geos import GEOSGeometry
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rio_tiler.errors import TileOutsideBounds

from server.watershed.models import Watershed
from server.watershed.sbs_raster.color_map import (
    ColorMode,
    SBS_CLASS_LABELS,
    get_colormap,
    get_colormap_metadata,
    get_render_colormap,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SBS_CLASSES = {130, 131, 132, 133}
_SBS_RENDER_CLASSES = {0, 1, 2, 3}

_MINIMAL_PNG = (
    b'\x89PNG\r\n\x1a\n'          # PNG signature
    b'\x00\x00\x00\rIHDR'          # IHDR length + type
    b'\x00\x00\x00\x01'            # width  = 1
    b'\x00\x00\x00\x01'            # height = 1
    b'\x08\x02'                    # bit depth 8, colour type 2 (RGB)
    b'\x00\x00\x00'                # compression / filter / interlace
    b'\x90wS\xde'                  # CRC
    b'\x00\x00\x00\x0cIDATx'       # IDAT
    b'\x9cc\xf8\x0f\x00\x00\x01'
    b'\x01\x00\x18\xdd\x01\xb8'
    b'\x00\x00\x00\x00IEND\xaeB`\x82'
)


def _create_watershed(runid: str) -> Watershed:
    """Create a minimal Watershed row for testing."""
    return Watershed.objects.create(
        runid=runid,
        pws_id='92500',
        pws_name='Test Water Division',
        county_nam='Test County',
        shape_leng=0.5,
        shape_area=0.01,
        geom=GEOSGeometry('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))'),
    )


# ---------------------------------------------------------------------------
# color_map: ColorMode enum
# ---------------------------------------------------------------------------

class ColorModeTests(unittest.TestCase):
    def test_legacy_value(self):
        self.assertEqual(ColorMode.LEGACY.value, 'legacy')

    def test_shift_value(self):
        self.assertEqual(ColorMode.SHIFT.value, 'shift')

    def test_constructible_from_string(self):
        self.assertEqual(ColorMode('legacy'), ColorMode.LEGACY)
        self.assertEqual(ColorMode('shift'), ColorMode.SHIFT)

    def test_invalid_string_raises(self):
        with self.assertRaises(ValueError):
            ColorMode('unsupported')


# ---------------------------------------------------------------------------
# color_map: get_colormap()
# ---------------------------------------------------------------------------

class GetColormapTests(unittest.TestCase):
    def test_legacy_contains_all_sbs_classes(self):
        self.assertEqual(set(get_colormap(ColorMode.LEGACY).keys()), _SBS_CLASSES)

    def test_shift_contains_all_sbs_classes(self):
        self.assertEqual(set(get_colormap(ColorMode.SHIFT).keys()), _SBS_CLASSES)

    def test_default_mode_is_legacy(self):
        self.assertEqual(get_colormap(), get_colormap(ColorMode.LEGACY))

    def test_rgba_tuples_have_four_channels(self):
        for mode in ColorMode:
            cm = get_colormap(mode)
            for cls, rgba in cm.items():
                self.assertEqual(
                    len(rgba), 4,
                    f"[{mode}] class {cls}: expected 4 channels, got {len(rgba)}",
                )

    def test_rgba_channel_values_are_in_valid_range(self):
        for mode in ColorMode:
            cm = get_colormap(mode)
            for cls, rgba in cm.items():
                for i, channel in enumerate(rgba):
                    self.assertGreaterEqual(channel, 0,   f"[{mode}] class {cls} channel {i} < 0")
                    self.assertLessEqual(channel,   255, f"[{mode}] class {cls} channel {i} > 255")

    def test_alpha_is_fully_opaque_for_all_modes(self):
        for mode in ColorMode:
            cm = get_colormap(mode)
            for cls, rgba in cm.items():
                self.assertEqual(
                    rgba[3], 255,
                    f"[{mode}] class {cls}: alpha should be 255 (fully opaque)",
                )

    def test_legacy_and_shift_palettes_differ(self):
        """The two modes must use distinct colour values."""
        legacy = get_colormap(ColorMode.LEGACY)
        shift  = get_colormap(ColorMode.SHIFT)
        self.assertNotEqual(legacy, shift)

    def test_legacy_unburned_colour(self):
        cm = get_colormap(ColorMode.LEGACY)
        self.assertEqual(cm[130], (0, 115, 74, 255))   # #00734A

    def test_shift_unburned_is_okabe_ito(self):
        cm = get_colormap(ColorMode.SHIFT)
        self.assertEqual(cm[130], (0, 158, 115, 255))  # #009E73


# ---------------------------------------------------------------------------
# color_map: get_render_colormap()  — 0-based pixel keys for tile rendering
# ---------------------------------------------------------------------------

class GetRenderColormapTests(unittest.TestCase):
    def test_legacy_contains_pixel_values_0_to_3(self):
        self.assertEqual(set(get_render_colormap(ColorMode.LEGACY).keys()), _SBS_RENDER_CLASSES)

    def test_shift_contains_pixel_values_0_to_3(self):
        self.assertEqual(set(get_render_colormap(ColorMode.SHIFT).keys()), _SBS_RENDER_CLASSES)

    def test_default_mode_is_legacy(self):
        self.assertEqual(get_render_colormap(), get_render_colormap(ColorMode.LEGACY))

    def test_rgba_tuples_have_four_channels(self):
        for mode in ColorMode:
            for px, rgba in get_render_colormap(mode).items():
                self.assertEqual(len(rgba), 4, f"[{mode}] pixel {px}: expected 4 channels")

    def test_rgba_channel_values_are_in_valid_range(self):
        for mode in ColorMode:
            for px, rgba in get_render_colormap(mode).items():
                for i, ch in enumerate(rgba):
                    self.assertGreaterEqual(ch, 0,   f"[{mode}] px {px} ch {i} < 0")
                    self.assertLessEqual(ch,   255, f"[{mode}] px {px} ch {i} > 255")

    def test_colours_match_canonical_colormap(self):
        """Render colormap colours must be identical to the canonical 130-based map."""
        canonical_order = [130, 131, 132, 133]  # Unburned, Low, Moderate, High
        for mode in ColorMode:
            canonical = get_colormap(mode)
            render = get_render_colormap(mode)
            for render_px, canonical_cls in enumerate(canonical_order):
                self.assertEqual(
                    render[render_px], canonical[canonical_cls],
                    f"[{mode}] render pixel {render_px} != canonical class {canonical_cls}",
                )

    def test_legacy_and_shift_palettes_differ(self):
        self.assertNotEqual(
            get_render_colormap(ColorMode.LEGACY),
            get_render_colormap(ColorMode.SHIFT),
        )


# ---------------------------------------------------------------------------
# color_map: get_colormap_metadata()
# ---------------------------------------------------------------------------

class GetColormapMetadataTests(unittest.TestCase):
    def test_returns_four_entries_per_mode(self):
        for mode in ColorMode:
            entries = get_colormap_metadata(mode)
            self.assertEqual(len(entries), 4, f"[{mode}] expected 4 entries")

    def test_default_mode_is_legacy(self):
        self.assertEqual(get_colormap_metadata(), get_colormap_metadata(ColorMode.LEGACY))

    def test_each_entry_has_required_keys(self):
        required_keys = {'class_value', 'label', 'rgba', 'hex'}
        for mode in ColorMode:
            for entry in get_colormap_metadata(mode):
                self.assertTrue(
                    required_keys.issubset(entry.keys()),
                    f"[{mode}] entry missing keys: {required_keys - entry.keys()}",
                )

    def test_class_values_are_correct(self):
        for mode in ColorMode:
            entries = get_colormap_metadata(mode)
            self.assertEqual({e['class_value'] for e in entries}, _SBS_CLASSES)

    def test_entries_are_sorted_by_class_value(self):
        for mode in ColorMode:
            entries = get_colormap_metadata(mode)
            values = [e['class_value'] for e in entries]
            self.assertEqual(values, sorted(values))

    def test_labels_match_sbs_class_labels(self):
        for mode in ColorMode:
            for entry in get_colormap_metadata(mode):
                expected = SBS_CLASS_LABELS[entry['class_value']]
                self.assertEqual(entry['label'], expected)

    def test_rgba_is_list_of_four_ints(self):
        for mode in ColorMode:
            for entry in get_colormap_metadata(mode):
                self.assertIsInstance(entry['rgba'], list)
                self.assertEqual(len(entry['rgba']), 4)
                for channel in entry['rgba']:
                    self.assertIsInstance(channel, int)

    def test_hex_matches_six_digit_uppercase_format(self):
        import re
        pattern = re.compile(r'^#[0-9A-F]{6}$')
        for mode in ColorMode:
            for entry in get_colormap_metadata(mode):
                self.assertRegex(
                    entry['hex'], pattern,
                    f"[{mode}] class {entry['class_value']}: hex '{entry['hex']}' has unexpected format",
                )

    def test_hex_is_consistent_with_rgba(self):
        for mode in ColorMode:
            for entry in get_colormap_metadata(mode):
                r, g, b = entry['rgba'][:3]
                expected_hex = '#{:02X}{:02X}{:02X}'.format(r, g, b)
                self.assertEqual(
                    entry['hex'], expected_hex,
                    f"[{mode}] class {entry['class_value']}: hex does not match rgba",
                )

    def test_rgba_values_match_colormap(self):
        """Metadata rgba values must agree with get_colormap()."""
        for mode in ColorMode:
            cm = get_colormap(mode)
            for entry in get_colormap_metadata(mode):
                expected_rgba = list(cm[entry['class_value']])
                self.assertEqual(entry['rgba'], expected_rgba)

    def test_legacy_specific_hex_values(self):
        entries = {e['class_value']: e for e in get_colormap_metadata(ColorMode.LEGACY)}
        self.assertEqual(entries[130]['hex'], '#00734A')  # Unburned
        self.assertEqual(entries[131]['hex'], '#4DE600')  # Low
        self.assertEqual(entries[132]['hex'], '#FFFF00')  # Moderate
        self.assertEqual(entries[133]['hex'], '#FF0000')  # High

    def test_shift_specific_hex_values(self):
        entries = {e['class_value']: e for e in get_colormap_metadata(ColorMode.SHIFT)}
        self.assertEqual(entries[130]['hex'], '#009E73')  # Unburned (Okabe-Ito)
        self.assertEqual(entries[131]['hex'], '#56B4E9')  # Low
        self.assertEqual(entries[132]['hex'], '#F0E442')  # Moderate
        self.assertEqual(entries[133]['hex'], '#CC79A7')  # High


# ---------------------------------------------------------------------------
# SbsColormapView: GET /api/watersheds/sbs/colormap
# ---------------------------------------------------------------------------

class SbsColormapViewTests(APITestCase):
    """Tests for SbsColormapView — no database interaction required."""

    def _url(self, **params):
        url = reverse('sbs-colormap')
        if params:
            query = '&'.join(f'{k}={v}' for k, v in params.items())
            url = f'{url}?{query}'
        return url

    def test_returns_200(self):
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_response_contains_mode_and_entries(self):
        response = self.client.get(self._url())
        self.assertIn('mode', response.data)
        self.assertIn('entries', response.data)

    def test_default_mode_is_legacy(self):
        response = self.client.get(self._url())
        self.assertEqual(response.data['mode'], 'legacy')

    def test_explicit_legacy_mode(self):
        response = self.client.get(self._url(mode='legacy'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['mode'], 'legacy')

    def test_shift_mode(self):
        response = self.client.get(self._url(mode='shift'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['mode'], 'shift')

    def test_invalid_mode_falls_back_to_legacy(self):
        response = self.client.get(self._url(mode='invalid'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['mode'], 'legacy')

    def test_entries_contains_four_items(self):
        response = self.client.get(self._url())
        self.assertEqual(len(response.data['entries']), 4)

    def test_entries_have_required_fields(self):
        response = self.client.get(self._url())
        for entry in response.data['entries']:
            self.assertIn('class_value', entry)
            self.assertIn('label',       entry)
            self.assertIn('rgba',        entry)
            self.assertIn('hex',         entry)

    def test_legacy_and_shift_entries_differ(self):
        legacy = self.client.get(self._url(mode='legacy')).data['entries']
        shift  = self.client.get(self._url(mode='shift')).data['entries']
        # Entries are dicts — at least one colour must be different
        self.assertNotEqual(legacy, shift)

    def test_all_four_sbs_class_values_present(self):
        response = self.client.get(self._url())
        class_values = {e['class_value'] for e in response.data['entries']}
        self.assertEqual(class_values, _SBS_CLASSES)

    def test_hex_field_is_six_digit_hex(self):
        import re
        pattern = re.compile(r'^#[0-9A-F]{6}$')
        response = self.client.get(self._url())
        for entry in response.data['entries']:
            self.assertRegex(entry['hex'], pattern)


# ---------------------------------------------------------------------------
# SbsRasterTileView: GET /api/watersheds/<runid>/sbs/tiles/<z>/<x>/<y>.png
# ---------------------------------------------------------------------------

_TILE_PATCH_TARGET = 'server.watershed.sbs_raster.views.get_tile_png'
_CONFIG_PATCH_TARGET = 'server.watershed.sbs_raster.views.get_config'


def _mock_config(base_url: str = 'https://wepp.cloud/weppcloud') -> MagicMock:
    config = MagicMock()
    config.api.weppcloud_base_url = base_url
    return config


class SbsRasterTileViewTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.watershed = _create_watershed('test-run-123')

    def _url(self, runid: str, z: int = 10, x: int = 160, y: int = 387, **params) -> str:
        url = reverse('sbs-tile', args=[runid, z, x, y])
        if params:
            query = '&'.join(f'{k}={v}' for k, v in params.items())
            url = f'{url}?{query}'
        return url

    # -- 404 for unknown watershed ------------------------------------------

    def test_unknown_watershed_returns_404(self):
        url = self._url('nonexistent-run-id')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -- Successful tile responses ------------------------------------------

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_known_watershed_returns_200(self, mock_tile, mock_cfg):
        url = self._url(self.watershed.runid)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_response_content_type_is_png(self, mock_tile, mock_cfg):
        url = self._url(self.watershed.runid)
        response = self.client.get(url)
        self.assertEqual(response['Content-Type'], 'image/png')

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_response_body_is_png_bytes(self, mock_tile, mock_cfg):
        url = self._url(self.watershed.runid)
        response = self.client.get(url)
        self.assertEqual(response.content, _MINIMAL_PNG)

    # -- Color mode forwarding ----------------------------------------------

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_default_color_mode_is_legacy(self, mock_tile, mock_cfg):
        url = self._url(self.watershed.runid)
        self.client.get(url)
        _z, _x, _y = 10, 160, 387
        mock_tile.assert_called_once()
        _, _, _, _, mode_arg = mock_tile.call_args[0]
        self.assertEqual(mode_arg, ColorMode.LEGACY)

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_shift_mode_forwarded_to_tile_renderer(self, mock_tile, mock_cfg):
        url = self._url(self.watershed.runid, mode='shift')
        self.client.get(url)
        _, _, _, _, mode_arg = mock_tile.call_args[0]
        self.assertEqual(mode_arg, ColorMode.SHIFT)

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_invalid_mode_falls_back_to_legacy(self, mock_tile, mock_cfg):
        url = self._url(self.watershed.runid, mode='bogus')
        self.client.get(url)
        _, _, _, _, mode_arg = mock_tile.call_args[0]
        self.assertEqual(mode_arg, ColorMode.LEGACY)

    # -- TIF URL construction -----------------------------------------------

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config('https://wepp.cloud/weppcloud'))
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_tif_url_is_constructed_from_config_and_runid(self, mock_tile, mock_cfg):
        url = self._url(self.watershed.runid)
        self.client.get(url)
        tif_url_arg = mock_tile.call_args[0][0]
        expected = (
            f'https://wepp.cloud/weppcloud/runs/{self.watershed.runid}'
            '/disturbed_wbt/download/disturbed/prediction_wgs84_merged.wgs.tif'
        )
        self.assertEqual(tif_url_arg, expected)

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config('https://wepp.cloud/weppcloud/'))
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_trailing_slash_in_base_url_is_stripped(self, mock_tile, mock_cfg):
        """A trailing slash on the configured base URL must not produce a double slash."""
        url = self._url(self.watershed.runid)
        self.client.get(url)
        tif_url_arg = mock_tile.call_args[0][0]
        self.assertNotIn('//', tif_url_arg.split('://', 1)[1])

    # -- Tile coordinate forwarding -----------------------------------------

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, return_value=_MINIMAL_PNG)
    def test_tile_coordinates_forwarded_to_renderer(self, mock_tile, mock_cfg):
        url = self._url(self.watershed.runid, z=8, x=42, y=99)
        self.client.get(url)
        _, z_arg, x_arg, y_arg, _ = mock_tile.call_args[0]
        self.assertEqual(z_arg, 8)
        self.assertEqual(x_arg, 42)
        self.assertEqual(y_arg, 99)

    # -- Tile outside bounds ------------------------------------------------

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, side_effect=TileOutsideBounds)
    def test_tile_outside_bounds_returns_404(self, mock_tile, mock_cfg):
        """
        When the requested tile lies outside the raster extent the view should
        return 404.  The view catches TileOutsideBoundsError (aliased from
        rio_tiler.errors.TileOutsideBounds) and raises DRF NotFound.
        """
        url = self._url(self.watershed.runid)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # -- Rasterio HTTP 404 (TIF not found on remote) ------------------------

    @patch(_CONFIG_PATCH_TARGET, return_value=_mock_config())
    @patch(_TILE_PATCH_TARGET, side_effect=rasterio.errors.RasterioIOError("HTTP response code: 404"))
    def test_rasterio_io_error_returns_404(self, mock_tile, mock_cfg):
        """
        When rasterio cannot open the remote TIF (e.g. the run has no SBS
        data, or the tile request hits a path that does not exist on WEPPcloud)
        the view should return 404 rather than leaking a 500.
        """
        url = self._url(self.watershed.runid)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
