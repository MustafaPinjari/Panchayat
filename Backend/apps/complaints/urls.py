from django.urls import path

from apps.complaints.views import (
    AnalyticsView,
    CategorizationView,
    CommentCreateView,
    CommentListView,
    ComplaintAssignView,
    ComplaintDetailView,
    ComplaintListCreateView,
    ComplaintStatusView,
)

complaint_urlpatterns = [
    # Mounted under api/complaints/ in config/urls.py
    path('', ComplaintListCreateView.as_view(), name='complaint-list-create'),
    path('categorize/', CategorizationView.as_view(), name='complaint-categorize'),
    path('<str:id>/', ComplaintDetailView.as_view(), name='complaint-detail'),
    path('<str:id>/status/', ComplaintStatusView.as_view(), name='complaint-status'),
    path('<str:id>/assign/', ComplaintAssignView.as_view(), name='complaint-assign'),
]

comment_urlpatterns = [
    # Mounted under api/comments/ in config/urls.py
    path('', CommentCreateView.as_view(), name='comment-create'),
    path('<str:complaint_id>/', CommentListView.as_view(), name='comment-list'),
]

# Default urlpatterns for complaint routes
urlpatterns = complaint_urlpatterns
