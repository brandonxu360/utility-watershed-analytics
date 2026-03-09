from rest_framework import serializers


class SbsColormapEntrySerializer(serializers.Serializer):
    value = serializers.IntegerField()
    hex = serializers.CharField()
    label = serializers.CharField(required=False)


class SbsColormapResponseSerializer(serializers.Serializer):
    mode = serializers.CharField()
    entries = SbsColormapEntrySerializer(many=True)
