from celery import Celery
from celery.schedules import crontab
from celery.signals import setup_logging

from app.app import app
from app.config import Config
from app.logging_config import configure_logging


celery = Celery(
    __name__,
    broker=Config.CELERY_BROKER_URL,
)
celery.config_from_object(Config)
celery.conf.update(task_track_started=True)


@setup_logging.connect
def init_celery_logging(**_kwargs):
    configure_logging(force=True)


class AppContextTask(celery.Task):
    abstract = True

    def __call__(self, *args, **kwargs):
        with app.app_context():
            return super().__call__(*args, **kwargs)


celery.Task = AppContextTask


@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    from app.tasks.booking import set_expired_bookings, delete_expired_bookings
    from app.tasks.seo import generate_seo_prerender

    sender.add_periodic_task(
        60.0,
        set_expired_bookings.s(),
        name="set-expired-bookings"
    )

    sender.add_periodic_task(
        crontab(hour=3, minute=0),
        delete_expired_bookings.s(),
        name="delete-expired-bookings"
    )

    sender.add_periodic_task(
        crontab(hour=2, minute=0),
        generate_seo_prerender.s(),
        name="generate-seo-prerender",
    )
