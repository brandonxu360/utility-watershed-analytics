from rest_framework import serializers


class WatershedPropertiesSerializer(serializers.Serializer):
    pws_name = serializers.CharField(allow_null=True, required=False)
    county_nam = serializers.CharField(allow_null=True, required=False)
    shape_area = serializers.FloatField(allow_null=True, required=False)
    srcname = serializers.CharField(allow_null=True, required=False)
    srctype = serializers.CharField(allow_null=True, required=False)
    owner_type = serializers.CharField(allow_null=True, required=False)
    pop_group = serializers.CharField(allow_null=True, required=False)
    treat_type = serializers.CharField(allow_null=True, required=False)
    huc10_utility_count = serializers.IntegerField(allow_null=True, required=False)
    huc10_pws_names = serializers.CharField(allow_null=True, required=False)


class WatershedFeatureSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.ChoiceField(choices=["Feature"])
    properties = WatershedPropertiesSerializer()
    geometry = serializers.JSONField(allow_null=True)


class WatershedFeatureCollectionSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["FeatureCollection"])
    features = WatershedFeatureSerializer(many=True)


class SubcatchmentPropertiesSerializer(serializers.Serializer):
    topazid = serializers.IntegerField()
    weppid = serializers.IntegerField()
    slope_scalar = serializers.FloatField(allow_null=True, required=False)
    length = serializers.FloatField(allow_null=True, required=False)
    width = serializers.FloatField(allow_null=True, required=False)
    aspect = serializers.FloatField(allow_null=True, required=False)
    hillslope_area = serializers.IntegerField(allow_null=True, required=False)
    simple_texture = serializers.CharField(allow_null=True, required=False)


class SubcatchmentFeatureSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.ChoiceField(choices=["Feature"])
    properties = SubcatchmentPropertiesSerializer()
    geometry = serializers.JSONField(allow_null=True)


class SubcatchmentFeatureCollectionSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["FeatureCollection"])
    features = SubcatchmentFeatureSerializer(many=True)


class ChannelPropertiesSerializer(serializers.Serializer):
    topazid = serializers.IntegerField()
    weppid = serializers.IntegerField()
    order = serializers.IntegerField()


class ChannelFeatureSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.ChoiceField(choices=["Feature"])
    properties = ChannelPropertiesSerializer()
    geometry = serializers.JSONField(allow_null=True)


class ChannelFeatureCollectionSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=["FeatureCollection"])
    features = ChannelFeatureSerializer(many=True)


class NotFoundSerializer(serializers.Serializer):
    detail = serializers.CharField()


class SchemaPlaceholderSerializer(serializers.Serializer):
    """Placeholder serializer used for DRF schema machinery compatibility."""
