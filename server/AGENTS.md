# Avexmar Hub - Server Guide

This guide covers backend structure, patterns, and conventions. Refer to ../AGENTS.md for project overview and global guidelines.

## Backend Architecture (`/server`)

### Directory Structure

```
server/
├── app/
│   ├── controllers/        # REST API endpoints
│   ├── models/            # SQLAlchemy database models
│   ├── middlewares/       # Authentication, error handling
│   ├── utils/             # Helper utilities
│   ├── templates/         # Email templates
│   ├── app.py            # Flask application factory
│   ├── config.py         # Configuration management
│   └── database.py       # Database initialization
├── migrations/           # Flask-Migrate database migrations
├── tests/               # pytest test suite
└── requirements.txt     # Python dependencies
```

### Key Models and Relationships

```
User → Booking → BookingPassenger → Passenger
            ↓
        BookingFlight → Flight → Route → Airport
                           ↓
                    FlightTariff → Tariff
                           ↓
                        Ticket → Payment
```

**Core Models:**

- `User`: Authentication and role management (admin/customer)
- `Airport`: Airport information with IATA codes and locations
- `Airline`: Airline companies
- `Aircraft`: Aircraft types and seat configurations
- `Route`: Flight routes between airports
- `Flight`: Scheduled flights with pricing
- `Booking`: Customer flight reservations
- `Passenger`: Passenger information and documents
- `Ticket`: Generated tickets for confirmed bookings
- `Payment`: Payment processing and status tracking

### API Endpoints Structure

All controllers follow RESTful conventions:

- `GET /entity` - List all entities
- `POST /entity` - Create new entity
- `GET /entity/{id}` - Get specific entity
- `PUT /entity/{id}` - Update entity
- `DELETE /entity/{id}` - Delete entity

**Key Endpoint Groups:**

- `/auth` - Authentication (login, register, password reset)
- `/users` - User management
- `/airports`, `/airlines`, `/aircrafts` - Aviation data
- `/routes`, `/flights`, `/tariffs` - Flight scheduling
- `/bookings`, `/passengers`, `/tickets` - Booking process
- `/payments` - Payment processing
- `/search` - Flight search functionality

### Authentication & Authorization

- JWT-based authentication with configurable expiration
- Role-based access control (admin/customer)
- Admin-only endpoints protected with `@admin_required` decorator
- Session management middleware for request handling

### Backend Patterns

**Model Definition:**

```python
class EntityName(_BaseModel):
    __tablename__ = 'table_name'

    # Fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)

    # Relationships
    related_entity = db.relationship('RelatedEntity', back_populates='entity_name')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            # ... other fields
        }
```

**Controller Pattern:**

```python
from app.middlewares.auth_middleware import admin_required

def get_entities():
    entities = Entity.get_all()
    return jsonify([e.to_dict() for e in entities])

@admin_required
def create_entity(current_user):
    body = request.json
    entity = Entity.create(**body)
    return jsonify(entity.to_dict()), 201
```

## Backend Controller & Endpoint Conventions

Pattern used across controllers (CRUD resources):

- List: GET /<entity> → 200, returns an array of to_dict()
- Create: POST /<entity> → 201, returns created entity to_dict()
- Read: GET /<entity>/<id> → 200, returns to_dict()
- Update: PUT /<entity>/<id> → 200, returns updated to_dict()
- Delete: DELETE /<entity>/<id> → 200, returns delete result
- Bulk helpers (where applicable):
  - Template: GET /<entity>/template → xlsx file download
  - Upload: POST /<entity>/upload → creates in bulk or returns error file

Auth model:

- Public read endpoints for open data like airports, airlines, flights, tariffs (verify per product).
- Admin-only mutations (create/update/delete) via @admin_required.
- Process/flow endpoints (booking, search, payments, auth) follow specific route groups and use @current_user or @login_required as needed.

Standard response shapes:

- Success: jsonify(data | { message, ... }), explicit status codes for creates (201).
- Errors: jsonify({ message, errors? }), with 4xx/5xx codes; controller utilities normalize shapes.

Suggested structure improvements (future):

- Move to Flask blueprints per domain (airports, flights, bookings, etc.) to avoid star imports in app.py and centralize route registration.
- Consolidate error responses into a helper to guarantee consistent payloads and status codes.

### Backend Consistency Audit (current codebase)

What’s consistent:

- CRUD pattern implemented in most controllers (airline, airport, flight, tariff, route, user, booking, etc.).
- Admin-only decorators consistently applied for mutations; read endpoints are generally public for reference data.
- Upload/template helpers implemented for entities that support xlsx (airports, airlines, flights).
- Booking process endpoints use @current_user and clearly separated flow: access → passengers → confirm → payment.

Minor inconsistencies and recommendations:

- Explicit vs implicit 200: some READ endpoints return `(...), 200` while others rely on Flask’s default 200. Recommendation: choose one (prefer explicit) and standardize.
- Flight tariffs: list/read endpoints are admin-only while similar reference entities (airports/airlines/flights/tariffs) are public. If intentional for business reasons, document it; otherwise, align access level.
- Upload endpoints return 201 even when returning an error xlsx. Recommendation: return 200 for ‘processed with issues’ (or 207 Multi-Status) with the file.
- app.py uses wildcard imports and manual route binding for every function. Recommendation: migrate to blueprints to reduce boilerplate and improve cohesion.

### Email Templates

- Each email must have matching `.txt` and `.html` templates under `app/templates/email/`.
- HTML templates extend `email/html/_base.html` and provide the same content as the text version.
- Keep messages concise; placeholders use Jinja syntax like `{{ variable }}`.
- When sending emails, always pass both `activation_url` or similar context and `expires_in_hours` if expiration is time based.
