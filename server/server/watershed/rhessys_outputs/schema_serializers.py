from rest_framework import serializers


class OutputVariableSerializer(serializers.Serializer):
    id = serializers.CharField()
    label = serializers.CharField()
    units = serializers.CharField()
    filename = serializers.CharField()


class OutputScenarioSerializer(serializers.Serializer):
    id = serializers.CharField()
    label = serializers.CharField()
    is_change = serializers.BooleanField()
    variables = serializers.ListField(child=serializers.CharField())


class RhessysOutputListResponseSerializer(serializers.Serializer):
    scenarios = OutputScenarioSerializer(many=True)
    variables = OutputVariableSerializer(many=True)
