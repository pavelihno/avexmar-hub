from typing import List, TYPE_CHECKING
from sqlalchemy.orm import Mapped, Session

from app.database import db
from app.models._base_model import BaseModel
from app.models.flight import Flight
from app.models.flight_tariff import FlightTariff
from app.models.tariff import Tariff
from app.utils.storage import ImageManager

if TYPE_CHECKING:
    from app.models.route import Route


class CarouselSlide(BaseModel):
    __tablename__ = 'carousel_slides'

    title = db.Column(db.String, nullable=False)
    route_id = db.Column(db.Integer, db.ForeignKey('routes.id', ondelete='RESTRICT'), nullable=True)
    image_filename = db.Column(db.String, nullable=True)
    image_path = db.Column(db.String, nullable=True)
    alt = db.Column(db.String, nullable=False)
    display_order = db.Column(db.Integer, nullable=False, default=0)
    badge = db.Column(db.String, nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=False)

    route: Mapped['Route'] = db.relationship(
        'Route', back_populates='carousel_slides'
    )

    def _compute_route_metrics(self) -> dict:
        if not self.route_id:
            return {}

        cheapest = (
            db.session.query(Tariff.price, Tariff.currency)
            .join(FlightTariff, FlightTariff.tariff_id == Tariff.id)
            .join(Flight, FlightTariff.flight_id == Flight.id)
            .filter(Flight.route_id == self.route_id, Tariff.price.isnot(None))
            .order_by(Tariff.price.asc())
            .first()
        )

        flights = db.session.query(Flight).filter(
            Flight.route_id == self.route_id
        ).all()
        durations = [
            flight.flight_duration for flight in flights if flight.flight_duration
        ]

        return {
            'price_from': cheapest.price if cheapest else None,
            'currency': cheapest.currency.value if cheapest else None,
            'duration_minutes': min(durations) if durations else None,
        }

    def to_dict(self, return_children=False) -> dict:

        image_manager = ImageManager()

        return {
            'id': self.id,
            'title': self.title,
            'badge': self.badge,
            'description': self.description,
            'image_url': image_manager.get_file_url(self.image_filename, 'carousel') if self.image_filename else None,
            'alt': self.alt,
            'route': self.route.to_dict(return_children=True) if self.route_id and return_children else {},
            'route_id': self.route_id,
            'route_metrics': self._compute_route_metrics(),
            'is_active': self.is_active,
            'display_order': self.display_order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def update(
        cls,
        _id,
        session: Session | None = None,
        *,
        commit: bool = False,
        **kwargs,
    ):
        session = session or db.session

        slide = cls.get_or_404(_id, session)

        if 'image_path' in kwargs and kwargs['image_path'] is not None:
            # Delete old image file if a new one is uploaded
            old_image_path = slide.image_path
            if old_image_path and old_image_path != kwargs['image_path']:
                ImageManager().delete_file(
                    slide.image_filename,
                    subfolder_name='carousel'
                )

        return super().update(_id, session, commit=commit, **kwargs)
    
    @classmethod
    def delete(
        cls,
        _id,
        session: Session | None = None,
        *,
        commit: bool = False,
    ):
        session = session or db.session

        slide = cls.get_or_404(_id, session)

        ImageManager().delete_file(
            slide.image_filename,
            subfolder_name='carousel'
        )

        return super().delete(_id, session, commit=commit)
