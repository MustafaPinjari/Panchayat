from django.urls import path
from apps.notifications.views import NotificationListView, NotificationReadView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('<str:id>/read/', NotificationReadView.as_view(), name='notification-read'),
]
