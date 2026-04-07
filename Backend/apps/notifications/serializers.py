from rest_framework import serializers


class NotificationSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField(read_only=True)
    message = serializers.CharField(read_only=True)
    read_status = serializers.BooleanField(read_only=True)
    created_at = serializers.CharField(read_only=True)
