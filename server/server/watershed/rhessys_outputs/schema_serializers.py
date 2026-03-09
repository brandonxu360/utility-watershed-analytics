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


class ValueRangeSerializer(serializers.Serializer):
    min = serializers.FloatField()
    max = serializers.FloatField()


class RhessysOutputListResponseSerializer(serializers.Serializer):
    scenarios = OutputScenarioSerializer(many=True)
    variables = OutputVariableSerializer(many=True)
    value_ranges = serializers.DictField(
        child=serializers.DictField(child=ValueRangeSerializer()),
        help_text="Nested dict: {scenario_id: {variable_id: {min, max}}}",
    )
