from django.urls import path
from apps.audio_processing.views import AudioUploadView

urlpatterns = [
    path('audio-upload/', AudioUploadView.as_view(), name='audio-upload'),
]
