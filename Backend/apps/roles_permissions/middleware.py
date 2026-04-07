"""
JWTMiddleware — reads the Bearer token from the Authorization header,
decodes it, and attaches a lightweight user object to `request.user`
with `user_id`, `email`, and `role` attributes.

This runs before DRF's own authentication so that permission classes
can rely on `request.user.role` being set for every request.
"""
import logging

from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

logger = logging.getLogger(__name__)


class _JWTUser:
    """
    Minimal user-like object populated from JWT claims.
    Satisfies DRF's `request.user.is_authenticated` contract.
    """

    is_authenticated = True
    is_active = True

    def __init__(self, user_id: str, email: str, role: str):
        self.user_id = user_id
        self.pk = user_id          # simplejwt / DRF compatibility
        self.id = user_id
        self.email = email
        self.role = role

    def __str__(self):
        return f'<JWTUser {self.email} role={self.role}>'


class JWTMiddleware:
    """
    Django middleware that decodes the JWT access token and attaches
    a `_JWTUser` instance to `request.user`.

    If no valid token is present, `request.user` is left as
    `AnonymousUser` so that DRF's `IsAuthenticated` permission class
    can reject the request with HTTP 401.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        self._attach_user(request)
        return self.get_response(request)

    @staticmethod
    def _attach_user(request) -> None:
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            request.user = AnonymousUser()
            return

        raw_token = auth_header.split(' ', 1)[1].strip()
        try:
            token = AccessToken(raw_token)
            request.user = _JWTUser(
                user_id=str(token.get('user_id', token.get('user_id', ''))),
                email=str(token.get('email', '')),
                role=str(token.get('role', 'resident')),
            )
        except (InvalidToken, TokenError) as exc:
            logger.debug('JWT decode failed: %s', exc)
            request.user = AnonymousUser()
