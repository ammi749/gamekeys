import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gamekeys.settings')

app = Celery('gamekeys')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs
app.autodiscover_tasks()

# Configure periodic tasks
app.conf.beat_schedule = {
    'sync-external-products': {
        'task': 'orders.tasks.sync_external_products',
        'schedule': crontab(hour='*/6'),  # Run every 6 hours
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')