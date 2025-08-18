from app.database import db


def register_session_handler(app):
    """Register transaction middleware to handle database sessions"""

    @app.teardown_request
    def _teardown_transaction(exception=None):
        session = db.session
        if exception:
            session.rollback()
        else:
            try:
                session.commit()
            except Exception:
                session.rollback()
                raise
        session.remove()
