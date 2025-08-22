from celery import Celery

from app.app import app
from app.config import Config


celery = Celery(
    __name__,
    broker=Config.CELERY_BROKER_URL,
)
celery.config_from_object(Config)
celery.conf.update(task_track_started=True)


class AppContextTask(celery.Task):
    abstract = True

    def __call__(self, *args, **kwargs):
        with app.app_context():
            return super().__call__(*args, **kwargs)


celery.Task = AppContextTask


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    from app.tasks.booking import cleanup_expired_bookings

    sender.add_periodic_task(60.0, cleanup_expired_bookings.s())
