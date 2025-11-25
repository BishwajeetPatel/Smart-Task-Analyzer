from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model with validation.
    """
    class Meta:
        model = Task
        fields = ['id', 'title', 'due_date', 'estimated_hours', 
                  'importance', 'dependencies', 'priority_score']
        read_only_fields = ['id', 'priority_score']
    
    def validate_estimated_hours(self, value):
        """Ensure estimated hours is positive."""
        if value < 0.5:
            raise serializers.ValidationError(
                "Estimated hours must be at least 0.5"
            )
        return value
    
    def validate_importance(self, value):
        """Ensure importance is between 1-10."""
        if not 1 <= value <= 10:
            raise serializers.ValidationError(
                "Importance must be between 1 and 10"
            )
        return value


class TaskAnalyzeSerializer(serializers.Serializer):
    """
    Serializer for analyzing a list of tasks.
    """
    tasks = serializers.ListField(
        child=serializers.DictField(),
        allow_empty=False
    )
    strategy = serializers.ChoiceField(
        choices=['smart_balance', 'fastest_wins', 'high_impact', 'deadline_driven'],
        default='smart_balance'
    )
