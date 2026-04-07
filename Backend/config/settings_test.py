import os

# Set required env vars before importing base settings so the startup guards pass
os.environ.setdefault('SECRET_KEY', 'test-secret-key-not-for-production')

from config.settings import *  # noqa

DEBUG = True
SECRET_KEY = 'test-secret-key-not-for-production'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable throttling in tests
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []  # noqa
