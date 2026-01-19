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
        runid = webcloud_run_id,
        pws_id = '92500',
        pws_name = 'WALLA WALLA WATER DIVISION',
        county_nam = 'WALLA WALLA',
        shape_leng = 0.472855984097,
        shape_area = 0.0103572037137,
        geom=GEOSGeometry('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))')
    )

def create_subcatchment(watershed: Watershed, topazid: int = 1):
    """
    Create a subcatchment with default values for the fields not relevant to these tests.
    The `topazid` parameter differentiates subcatchments within a watershed.
    """
    return Subcatchment.objects.create(
        watershed = watershed,
        topazid = topazid,
        weppid = 256,
        slope_scalar = 0.6218448136200627,
        length = 514.2640687119285,
        width = 225.75950190491503,
        direction = 263.418055344822,
        aspect = 203.11680078138295,
        hillslope_area = 116100,
        elevation = 1757.1,
        centroid_px = 323,
        centroid_py = 84,
        centroid_lon = -117.94306632380938,
        centroid_lat = 46.06653854935349,
        cancov = 0.9,
        inrcov = 1,
        rilcov = 1,
        mukey = '666981',
        clay = 8.5,
        sand = 33.5,
        simple_texture = 'silt loam',
        geom = GEOSGeometry('MULTIPOLYGON(((0 0, 1 0, 1 1, 0 1, 0 0)))')
    )


class SubcatchmentTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # Watershed 1 associated with subcatchments with topazid 1 & 2
        cls.watershed_with_multiple_subcatchments = create_watershed('WS-1')
        create_subcatchment(cls.watershed_with_multiple_subcatchments, topazid=1)
        create_subcatchment(cls.watershed_with_multiple_subcatchments, topazid=2)

        # Watershed 2 associated with subcatchment with topazid 3
        cls.watershed_with_subcatchment = create_watershed('WS-2')
        create_subcatchment(cls.watershed_with_subcatchment, topazid=3)

        # Watershed 3 with no associated subcatchments
        cls.watershed_without_subcatchments = create_watershed('WS-3')

    def test_only_linked_subcatchments_returned(self):
        """
        Only the subcatchments related to the specified watershed should be returned. 
        """
        # Act
        url = reverse(
            'watershed-subcatchments',
            args=[self.watershed_with_multiple_subcatchments.runid]
            )
        response = self.client.get(url)

        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['features']), 2)
        response_topazids = [subcatchment['properties']['topazid'] for subcatchment in response.data['features']]
        self.assertIn(1, response_topazids)
        self.assertIn(2, response_topazids)
        self.assertNotIn(3, response_topazids)

    def test_no_linked_subcatchments(self):
        """
        An empty successful 200 response is expected when subcatchments for a specified watershed are requested but the
        watershed has no associated subcatchments.
        """
        # Act
        url = reverse(
            'watershed-subcatchments',
            args=[self.watershed_without_subcatchments.runid]
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