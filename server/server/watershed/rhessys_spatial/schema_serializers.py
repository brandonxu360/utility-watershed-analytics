from rest_framework import serializers


class RhessysSpatialFileSerializer(serializers.Serializer):
    filename = serializers.CharField()
    title = serializers.CharField(required=False)
    units = serializers.CharField(required=False)
    type = serializers.CharField(required=False)
    min = serializers.FloatField(required=False, allow_null=True)
    max = serializers.FloatField(required=False, allow_null=True)
    legend = serializers.JSONField(required=False, allow_null=True)


class RhessysSpatialListResponseSerializer(serializers.Serializer):
    files = RhessysSpatialFileSerializer(many=True)
