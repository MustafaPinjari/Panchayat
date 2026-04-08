"""
User authentication views:
  - RegisterView    POST /api/users/register/
  - LoginView       POST /api/users/login/
  - TokenRefreshView (re-exported from simplejwt)
  - UserListView    GET  /api/users/          (Admin only)
  - UserDetailView  GET/PUT/DELETE /api/users/{id}/ (Admin only)
"""
import logging
import uuid
from datetime import datetime, timezone

import bcrypt
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView  # re-export

from apps.roles_permissions.permissions import IsAdmin, IsCommitteeOrAdmin
from apps.users.serializers import UserSerializer
from services.firebase_service import firestore_service

logger = logging.getLogger(__name__)

__all__ = ['RegisterView', 'LoginView', 'TokenRefreshView', 'UserListView', 'UserDetailView', 'ManagerListView']


def _issue_tokens_for_user(user_data: dict) -> dict:
    """
    Build a simplejwt RefreshToken for a Firestore user dict.
    We create a minimal Django-like object so simplejwt can call get_token().
    """
    from rest_framework_simplejwt.tokens import RefreshToken as RT

    # Build a lightweight object that satisfies simplejwt's interface
    _uid = user_data['id']
    _email = user_data.get('email', '')
    _role = user_data.get('role', 'resident')

    class _FirestoreUser:
        pk = _uid
        id = _uid          # simplejwt USER_ID_FIELD default is 'id'
        email = _email
        role = _role
        firestore_id = _uid
        is_active = True

    refresh = RT.for_user(_FirestoreUser())
    # Embed custom claims on both tokens
    refresh['user_id'] = user_data['id']
    refresh['email'] = user_data.get('email', '')
    refresh['role'] = user_data.get('role', 'resident')
    refresh['name'] = user_data.get('name', '')

    access = refresh.access_token
    access['user_id'] = user_data['id']
    access['email'] = user_data.get('email', '')
    access['role'] = user_data.get('role', 'resident')
    access['name'] = user_data.get('name', '')

    return {
        'refresh': str(refresh),
        'access': str(access),
    }


class RegisterView(APIView):
    """POST /api/users/register/ — no authentication required."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'detail': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_data = serializer.create(serializer.validated_data)
        user_id = str(uuid.uuid4())
        user_data['id'] = user_id
        user_data['created_at'] = datetime.now(timezone.utc).isoformat()

        try:
            firestore_service.set('users', user_id, user_data)
        except Exception as exc:
            logger.error('Firestore write failed during registration: %s', exc)
            return Response(
                {'error': 'Could not create user', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        tokens = _issue_tokens_for_user(user_data)
        # Return user fields (no password_hash) + tokens
        safe_user = {k: v for k, v in user_data.items() if k != 'password_hash'}
        return Response(
            {'user': safe_user, **tokens},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """POST /api/users/login/ — no authentication required."""

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            users = firestore_service.query(
                'users', filters=[('email', '==', email)]
            )
        except Exception as exc:
            logger.error('Firestore query failed during login: %s', exc)
            return Response(
                {'error': 'Authentication service unavailable.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        if not users:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user_data = users[0]
        stored_hash = user_data.get('password_hash', '')

        if not bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tokens = _issue_tokens_for_user(user_data)
        safe_user = {k: v for k, v in user_data.items() if k != 'password_hash'}
        return Response({'user': safe_user, **tokens}, status=status.HTTP_200_OK)


class _UserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserListView(APIView):
    """GET /api/users/ — paginated list of all users. Admin only."""

    permission_classes = [IsAdmin]

    def get(self, request):
        try:
            users = firestore_service.query('users')
        except Exception as exc:
            logger.error('Firestore query failed in UserListView: %s', exc)
            return Response(
                {'error': 'Could not retrieve users.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Strip password_hash from every record
        safe_users = [{k: v for k, v in u.items() if k != 'password_hash'} for u in users]

        paginator = _UserPagination()
        page = paginator.paginate_queryset(safe_users, request)
        return paginator.get_paginated_response(page)


class UserDetailView(APIView):

    permission_classes = [IsAdmin]

    def _get_user_or_404(self, user_id: str):
        try:
            user = firestore_service.get('users', user_id)
        except Exception as exc:
            logger.error('Firestore get failed in UserDetailView: %s', exc)
            return None, Response(
                {'error': 'Could not retrieve user.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        if user is None:
            return None, Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        return user, None

    def get(self, request, id):
        user, err = self._get_user_or_404(id)
        if err:
            return err
        safe_user = {k: v for k, v in user.items() if k != 'password_hash'}
        return Response(safe_user, status=status.HTTP_200_OK)

    def put(self, request, id):
        user, err = self._get_user_or_404(id)
        if err:
            return err

        serializer = UserSerializer(
            data=request.data,
            context={'instance_id': id},
        )
        if not serializer.is_valid():
            return Response(
                {'error': 'Validation failed', 'detail': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_data = serializer.create(serializer.validated_data)
        # Preserve immutable fields from the original document
        updated_data['id'] = id
        updated_data['created_at'] = user.get('created_at')

        try:
            firestore_service.set('users', id, updated_data)
        except Exception as exc:
            logger.error('Firestore set failed in UserDetailView.put: %s', exc)
            return Response(
                {'error': 'Could not update user.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        safe_user = {k: v for k, v in updated_data.items() if k != 'password_hash'}
        return Response(safe_user, status=status.HTTP_200_OK)

    def delete(self, request, id):
        _, err = self._get_user_or_404(id)
        if err:
            return err

        try:
            firestore_service.delete('users', id)
        except Exception as exc:
            logger.error('Firestore delete failed in UserDetailView.delete: %s', exc)
            return Response(
                {'error': 'Could not delete user.', 'detail': str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
