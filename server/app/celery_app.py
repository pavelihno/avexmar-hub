from celery import Celery

from app.app import app
from app.config import Config


celery = Celery(
    __name__,
    broker=Config.CELERY_BROKER_URL,
    backend=Config.CELERY_RESULT_BACKEND,
)


class AppContextTask(celery.Task):
    abstract = True

    def __call__(self, *args, **kwargs):
        with app.app_context():
            return super().__call__(*args, **kwargs)


celery.Task = AppContextTask


from app.tasks.booking import cleanup_expired_bookings


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(60.0, cleanup_expired_bookings.s())
