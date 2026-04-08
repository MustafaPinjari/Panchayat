"""
RBAC permission classes for Smart Society Management System.

These classes are applied to DRF views via `permission_classes`.
They rely on `request.user` being populated by JWTMiddleware with
`user_id`, `email`, and `role` attributes.
"""
from rest_framework.permissions import BasePermission, IsAuthenticated  # noqa: F401


class IsAdmin(BasePermission):
    """Allows access only to users with role == 'admin'."""

    message = 'Only administrators are allowed to perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'admin'
        )


class IsCommitteeOrAdmin(BasePermission):
    """Allows access to committee_member or admin roles."""

    message = 'Only committee members or administrators can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('committee_member', 'admin')
        )


class IsPropertyManager(BasePermission):
    """Allows access only to users with role == 'manager'."""

    message = 'Only property managers are allowed to perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'manager'
        )


class IsManagerOrCommitteeOrAdmin(BasePermission):
    """Allows access to manager, committee_member, or admin roles."""

    message = 'Only property managers, committee members, or administrators can perform this action.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('manager', 'committee_member', 'admin')
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission: allows access if the requesting user is the
    resource owner or has the admin role.

    Views must pass the owner identifier via the object's `created_by`
    or `user_id` attribute (checked in that order).
    """

    message = 'You do not have permission to access this resource.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'role', None) == 'admin':
            return True
        user_id = getattr(request.user, 'user_id', None)
        # Support both dict-style and attribute-style objects
        if isinstance(obj, dict):
            owner = obj.get('created_by') or obj.get('user_id')
        else:
            owner = getattr(obj, 'created_by', None) or getattr(obj, 'user_id', None)
        return user_id is not None and user_id == owner
