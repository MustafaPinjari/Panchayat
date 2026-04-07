from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/complaints/', include('apps.complaints.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/complaints/', include('apps.audio_processing.urls')),
    path('api/', include('apps.roles_permissions.urls')),
]
