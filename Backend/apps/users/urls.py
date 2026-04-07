from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.users.authentication import FirestoreTokenRefreshSerializer
from apps.users.views import LoginView, RegisterView, UserDetailView, UserListView

# Use our custom refresh serializer that skips the Django ORM user lookup
_token_refresh_view = TokenRefreshView.as_view(serializer_class=FirestoreTokenRefreshSerializer)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('login/', LoginView.as_view(), name='user-login'),
    path('token/refresh/', _token_refresh_view, name='token-refresh'),
    path('', UserListView.as_view(), name='user-list'),
    path('<str:id>/', UserDetailView.as_view(), name='user-detail'),
]
