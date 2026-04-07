"""
Serializers for the complaints app.

ComplaintSerializer  — full complaint document with conditional anonymity
CommentSerializer    — comment document
"""
from rest_framework import serializers

VALID_CATEGORIES = ('water', 'security', 'maintenance', 'noise', 'cleanliness', 'other')
VALID_STATUSES = ('pending', 'in_progress', 'resolved')


class ComplaintSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    text = serializers.CharField(max_length=5000)
    audio_url = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    created_by = serializers.CharField(read_only=True)
    anonymous = serializers.BooleanField(default=False)
    category = serializers.ChoiceField(choices=VALID_CATEGORIES)
    status = serializers.ChoiceField(choices=VALID_STATUSES, default='pending')
    created_at = serializers.CharField(read_only=True)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_admin = (
            request is not None
            and getattr(request.user, 'role', None) == 'admin'
        )
        if instance.get('anonymous') and not is_admin:
            data.pop('created_by', None)
        return data


class CommentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    complaint_id = serializers.CharField()
    created_by = serializers.CharField(read_only=True)
    text = serializers.CharField(max_length=5000)
    created_at = serializers.CharField(read_only=True)
