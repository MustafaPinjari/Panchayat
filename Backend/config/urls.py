from django.contrib import admin
from django.urls import path, include
from apps.complaints.urls import comment_urlpatterns
from apps.complaints.views import AnalyticsView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/complaints/', include('apps.complaints.urls')),
    path('api/audio/', include('apps.audio_processing.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/', include('apps.roles_permissions.urls')),
    # Comments — wired from apps/complaints/urls.py
    path('api/comments/', include((comment_urlpatterns, 'comments'))),
    path('api/admin/analytics/', AnalyticsView.as_view(), name='admin-analytics'),
]
