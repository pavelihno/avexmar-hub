from app.database import db


def register_session_handler(app):
    """Register transaction middleware to handle database sessions"""

    @app.teardown_request
    def _teardown_transaction(exception=None):
        session = db.session
        try:
            if exception:
                if session.in_transaction():
                    session.rollback()
            else:
                if session.in_transaction():
                    session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.remove()
