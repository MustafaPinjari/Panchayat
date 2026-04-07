"""
UserSerializer — validates and transforms user data.
Handles bcrypt password hashing and Firestore email uniqueness checks.
"""
import bcrypt
from rest_framework import serializers

from services.firebase_service import firestore_service

VALID_ROLES = ('resident', 'committee_member', 'admin')


class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    role = serializers.ChoiceField(choices=VALID_ROLES)
    flat_number = serializers.CharField(max_length=50)
    created_at = serializers.DateTimeField(read_only=True)
    # Write-only password — never returned in output
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_email(self, value):
        """Ensure email is unique in the Firestore users collection."""
        existing = firestore_service.query(
            'users',
            filters=[('email', '==', value)],
        )
        # On update, exclude the current user's own document
        instance_id = self.context.get('instance_id')
        if existing and (not instance_id or existing[0].get('id') != instance_id):
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        """Hash password and return a dict ready to be stored in Firestore."""
        raw_password = validated_data.pop('password')
        password_hash = bcrypt.hashpw(
            raw_password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')
        return {**validated_data, 'password_hash': password_hash}

    def to_representation(self, instance):
        """Exclude password_hash from all serialized output."""
        data = super().to_representation(instance)
        data.pop('password_hash', None)
        return data
