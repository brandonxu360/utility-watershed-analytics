from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.gis.geos import GEOSGeometry
from django.urls import reverse
from server.watershed.models import Watershed, Subcatchment

def create_watershed(webcloud_run_id: str):
    """
    Create a watershed with default values for fields that are not relevant to these tests.
    """
    return Watershed.objects.create(
        webcloud_run_id = webcloud_run_id,
        area_m2 = 189998,
        pws_id = '4100394',
        pws_name = 'IDANHA CITY WATER',
        county = 'LINN',
        sq_miles = 0.1476422461,
        geom=GEOSGeometry('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))')
    )

def create_subcatchment(watershed: Watershed, desc: str = 'Evergreen Forest'):
    """
    Create a subcatchment with default values for the fields not relevant to the these tests.
    The `desc` field can be commandeered to uniquely identify subcatchments.
    """
    return Subcatchment.objects.create(
        watershed = watershed,
        topazid = 1161,
        weppid = 256,
        slope_scalar = 0.6218448136200627,
        length_m = 514.2640687119285,
        width_m = 225.75950190491503,
        direction = 263.418055344822,
        aspect = 203.11680078138295,
        area_m2 = 116100,
        elevation_m = 1757.1,
        centroid_px = 323,
        centroid_py = 84,
        centroid_lon = -117.94306632380938,
        centroid_lat = 46.06653854935349,
        dom = 42,
        desc = desc,
        color = '#1c6330',
        cancov = 0.9,
        inrcov = 1,
        rilcov = 1,
        mukey = '666981-silt loam-forest',
        clay = 8.5,
        sand = 33.5,
        simple_texture = 'silt loam',
        runoff_volume_m3 = 41747.7,
        subrunoff_volume_m3 = 46767.1,
        baseflow_volume_m3 = 8584.3,
        soil_loss_kg = 102.3,
        sediment_deposition_kg = 0,
        sediment_yield_kg = 102.3,
        solub_react_phosphorus_kg = 0,
        particulate_phosphorus_kg = 0,
        total_phosphorus_kg = 0,
        soil = '666981-silt loam-forest',
        runoff_mm = 359.8939655172413,
        subrunoff_mm = 403.1646551724138,
        baseflow_mm = 74.00258620689654,
        deploss_kg = 8.818965517241379,
        geom = GEOSGeometry('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))')
    )


class SubcatchmentTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Watershed 1 associated with subcatchments 1 & 2
        cls.watershed_with_multiple_subcatchments = create_watershed('WS-1')
        create_subcatchment(cls.watershed_with_multiple_subcatchments, desc='SUB-1')
        create_subcatchment(cls.watershed_with_multiple_subcatchments, desc='SUB-2')

        # Watershed 2 associated with subcatchment 3
        cls.watershed_with_subcatchment = create_watershed('WS-2')
        create_subcatchment(cls.watershed_with_subcatchment, desc='SUB-3')

        # Watershed 3 with no associated subcatchments
        cls.watershed_without_subcatchments = create_watershed('WS-3')

    def test_only_linked_subcatchments_returned(self):
        """
        Only the subcatchments related to the specified watershed should be returned. 
        """
        # Act
        url = reverse(
            'watershed-subcatchments',
            args=[self.watershed_with_multiple_subcatchments.webcloud_run_id]
            )
        response = self.client.get(url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['features']), 2)
        response_descs = [subcatchment['properties']['desc'] for subcatchment in response.data['features']]
        self.assertIn('SUB-1', response_descs)
        self.assertIn('SUB-2', response_descs)
        self.assertNotIn('SUB-3', response_descs)

    def test_no_linked_subcatchments(self):
        """
        An empty successful 200 response is expected when subcatchments for a specified watershed are requested but the
        watershed has no associated subcatchments.
        """
        # Act
        url = reverse(
            'watershed-subcatchments',
            args=[self.watershed_without_subcatchments.webcloud_run_id]
        )
        response = self.client.get(url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['features']), 0)

    def test_nonexistant_watershed_linked_subcatchments(self):
        """
        An empty successful 200 response is expected when subcatchments for a nonexistant watershed are requested.
        """
        # Act 
        url = reverse(
            'watershed-subcatchments',
            args=['unrecognized-webcloud-run-id']
        )
        response = self.client.get(url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['features']), 0)