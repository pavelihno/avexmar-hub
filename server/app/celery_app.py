from celery import Celery, signals

from app.app import app
from app.config import Config


celery = Celery(__name__, broker=Config.CELERY_BROKER_URL, backend=Config.CELERY_RESULT_BACKEND)
celery.config_from_object(Config)
celery.conf.update(task_track_started=True)


class AppContextTask(celery.Task):
    abstract = True

    def __call__(self, *args, **kwargs):
        with app.app_context():
            return super().__call__(*args, **kwargs)


celery.Task = AppContextTask


@signals.task_prerun.connect
def log_task_start(sender=None, task_id=None, task=None, args=None, kwargs=None, **extra):
    app.logger.info('Starting task %s[%s]', task.name, task_id)


@signals.task_postrun.connect
def log_task_end(sender=None, task_id=None, task=None, retval=None, state=None, **extra):
    app.logger.info('Task %s[%s] finished with state=%s result=%s', task.name, task_id, state, retval)


from app.tasks.booking import cleanup_expired_bookings  # noqa: E402


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(60.0, cleanup_expired_bookings.s())
