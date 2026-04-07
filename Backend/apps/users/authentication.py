"""
Custom JWT token serializer that embeds user_id, email, and role
into the token payload.

Also provides a custom JWTAuthentication backend that resolves users
from token claims instead of the Django ORM (since we use Firestore).
"""
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Extends the default JWT payload with user_id, email, and role."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Embed custom claims from the Django user object
        token['user_id'] = str(getattr(user, 'firestore_id', user.pk))
        token['email'] = user.email
        token['role'] = getattr(user, 'role', 'resident')
        return token


class FirestoreTokenRefreshSerializer(TokenRefreshSerializer):
    """
    Overrides validate() to skip the Django ORM user-active check.
    Since users are stored in Firestore, we just validate the refresh token
    cryptographically and issue a new access token.
    """

    def validate(self, attrs):
        refresh = RefreshToken(attrs['refresh'])
        data = {'access': str(refresh.access_token)}

        from rest_framework_simplejwt.settings import api_settings
        if api_settings.ROTATE_REFRESH_TOKENS:
            if api_settings.BLACKLIST_AFTER_ROTATION:
                try:
                    refresh.blacklist()
                except AttributeError:
                    pass
            refresh.set_jti()
            refresh.set_exp()
            refresh.set_iat()
            data['refresh'] = str(refresh)

        return data


class FirestoreJWTAuthentication(JWTAuthentication):
    """
    Overrides get_user() to build a lightweight user object from JWT claims
    instead of querying the Django ORM. This is required because users are
    stored in Firestore, not in the Django database.
    """

    def get_user(self, validated_token):
        from apps.roles_permissions.middleware import _JWTUser

        user_id = validated_token.get('user_id', '')
        email = validated_token.get('email', '')
        role = validated_token.get('role', 'resident')

        if not user_id:
            return AnonymousUser()

        return _JWTUser(user_id=str(user_id), email=str(email), role=str(role))
