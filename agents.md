# Agents Overview

This document describes the domain "agents" (logical service responsibilities) that power the Avexmar airline ticket sales platform. Each agent maps to one or more controllers, models, and workflows in the codebase.

The backend is a Flask + SQLAlchemy application with Alembic migrations and Flask-Mail; payments are integrated via YooKassa. The frontend lives under `client/`.

Cross-cutting modules:
- Configuration: `server/app/config.py`
- Database: `server/app/database.py` (SQLAlchemy)
- Migrations: `server/migrations/*` (Alembic / Flask-Migrate)
- Email: `server/app/utils/email.py`
- Middlewares: `server/app/middlewares/*`
- App setup and routes: `server/app/app.py`

Key domain models include Country, Route, Seat, Fee, Flight, Airport, Airline, Aircraft, Booking, Payment, Ticket, User, and others under `server/app/models/`.

---

## Authentication Agent

**Responsibilities**
- User registration, login, authentication checks, password recovery/reset.
- Issues and validates JWTs.

**Key endpoints**
- `POST /register`
- `POST /login`
- `GET /auth`
- `POST /forgot_password`
- `POST /reset_password`

**Dependencies**
- Config: `SECRET_KEY`, `JWT_EXP_HOURS`, `CLIENT_URL` (CORS)
- DB: Users (model: `server/app/models/user.py`)
- JWT utilities: `server/app/utils/jwt.py`
- Auth middleware: `server/app/middlewares/auth_middleware.py`

**Security Notes**
- JWT expiry configured via `JWT_EXP_HOURS`
- CORS configured from `CLIENT_URL`
- Role-based access control with `USER_ROLE` enum (admin, standard)
- Auth middleware provides decorators: `@current_user`, `@login_required`, `@admin_required`, `@dev_tool`

---

## User Management Agent

**Responsibilities**
- CRUD for users, activation/deactivation, change password.
- User role management (admin/standard).

**Key endpoints**
- `GET /users`
- `POST /users`
- `GET /users/<int:user_id>`
- `PUT /users/<int:user_id>`
- `DELETE /users/<int:user_id>`
- `PUT /users/<int:user_id>/activate`
- `PUT /users/<int:user_id>/deactivate`
- `PUT /users/change_password`

**Dependencies**
- DB: Users (model: `server/app/models/user.py`)
- Controller: `server/app/controllers/user_controller.py`

---

## Search Agent

**Responsibilities**
- Search available flights based on route, date/time, and other criteria.
- Provide airport search for booking flows.
- Calculate pricing with tariffs, fees, and discounts.

**Key endpoints**
- `GET /search/airports` - Search airports with available routes
- `GET /search/flights` - Search available flights
- `GET /search/flights/nearby` - Find nearby flight alternatives
- `GET /search/flights/schedule` - Get flight schedules
- `GET /search/flights/<int:flight_id>/tariffs` - Get flight tariffs
- `POST /search/calculate/price` - Calculate total price with fees/discounts

**Dependencies**
- Models: `Route`, `Flight`, `FlightTariff`, `Timezone`, `Airport`, `Airline`, `Aircraft`
- Controller: `server/app/controllers/search_controller.py`
- Business logic: `server/app/utils/business_logic.py`

---

## Inventory & Scheduling Agent

**Responsibilities**
- Maintain catalogs for airports, airlines, aircraft, countries, timezones.
- Manage routes and scheduled flights.
- Provide time zone data for schedules and user display.
- Support bulk data import via Excel templates.

**Key Models and Controllers**
- **Countries**: `server/app/models/country.py`, `server/app/controllers/country_controller.py`
- **Airports**: `server/app/models/airport.py`, `server/app/controllers/airport_controller.py`
- **Airlines**: `server/app/models/airline.py`, `server/app/controllers/airline_controller.py`
- **Aircraft**: `server/app/models/aircraft.py`, `server/app/controllers/aircraft_controller.py`
- **Routes**: `server/app/models/route.py`, `server/app/controllers/route_controller.py`
- **Flights**: `server/app/models/flight.py`, `server/app/controllers/flight_controller.py`
- **Timezones**: `server/app/models/timezone.py`, `server/app/controllers/timezone_controller.py`

**Key endpoints (examples)**
- `GET /countries`, `POST /countries`, `PUT /countries/<id>`, `DELETE /countries/<id>`
- `GET /airports`, `POST /airports`, `PUT /airports/<id>`, `DELETE /airports/<id>`
- `GET /airlines`, `POST /airlines`, `PUT /airlines/<id>`, `DELETE /airlines/<id>`
- `GET /routes`, `POST /routes`, `PUT /routes/<id>`, `DELETE /routes/<id>`
- `GET /flights`, `POST /flights`, `PUT /flights/<id>`, `DELETE /flights/<id>`
- Upload endpoints: `POST /countries/upload`, `POST /airports/upload`, etc.
- Template endpoints: `GET /countries/template`, `GET /airports/template`, etc.

**Notable constraints**
- Route uniqueness: `(origin_airport_id, destination_airport_id)`
- Airport IATA/ICAO code uniqueness
- Airline IATA/ICAO code uniqueness

**Data Import Features**
- Excel template generation and parsing via `server/app/utils/xlsx.py`
- Bulk upload with error handling and validation
- Localized field names in templates (Russian)

---

## Pricing, Discounts, and Fees Agent

**Responsibilities**
- Compute final price including tariffs, discounts, and fees.
- Apply time-based fee policies for booking/cancel/change operations.
- Manage discount types (round trip, infant, child).

**Key Models**
- **Fee**: `server/app/models/fee.py`
  - Fields: `name`, `amount`, `application`, `application_term`
  - Method: `get_applicable_fees(application, hours_before_departure)`
  - Applies fee term logic:
    - booking: `application_term = none`
    - changes/cancellations: picks one of `before_24h`, `within_24h`, `after_departure` based on `hours_before_departure`
- **Discount**: `server/app/models/discount.py`
- **Tariff**: `server/app/models/tariff.py`
- **FlightTariff**: `server/app/models/flight_tariff.py`

**Key endpoints**
- `GET /fees`, `POST /fees`, `PUT /fees/<id>`, `DELETE /fees/<id>`
- `GET /discounts`, `POST /discounts`, `PUT /discounts/<id>`, `DELETE /discounts/<id>`
- `GET /tariffs`, `POST /tariffs`, `PUT /tariffs/<id>`, `DELETE /tariffs/<id>`
- `GET /flight_tariffs`, `POST /flight_tariffs`, `PUT /flight_tariffs/<id>`, `DELETE /flight_tariffs/<id>`

**Enums**
- `FEE_APPLICATION` (booking, cancellation), `FEE_TERM` (none, before_24h, within_24h, after_departure)
- `DISCOUNT_TYPE` (round_trip, infant, child)
- `CURRENCY` (rub)
- `SEAT_CLASS` (economy, business)

---

## Seat Management Agent

**Responsibilities**
- Seat inventory per flight tariff.
- Reserve/hold/release seats during booking.
- Ensure seat uniqueness within a tariff.

**Key Model**
- **Seat**: `server/app/models/seat.py`
  - `seat_number` unique per `tariff_id`
  - `booking_id` references `bookings.id` (nullable; `is_booked` derived property)
  - Relationships: `booking`, `tariff`, `ticket`

**Key endpoints**
- `GET /seats`, `POST /seats`, `PUT /seats/<id>`, `DELETE /seats/<id>`

**Controller**
- `server/app/controllers/seat_controller.py`

---

## Booking Agent

**Responsibilities**
- Create and manage bookings and passengers.
- Orchestrate booking flow: selection, passenger data, seat allocation, pricing, payment initiation, confirmation.
- Manage booking status transitions and validation.

**Key Models**
- **Booking**: `server/app/models/booking.py`
  - Status management with state machine
  - Public ID (UUID) for customer access
  - Booking number generation
  - Price breakdown (fare_price, fees, discounts)
- **BookingPassenger**: `server/app/models/booking_passenger.py`
- **BookingFlight**: `server/app/models/booking_flight.py`
- **Passenger**: `server/app/models/passenger.py`

**Key endpoints**
- Basic CRUD: `GET /bookings`, `POST /bookings`, `PUT /bookings/<id>`, `DELETE /bookings/<id>`
- Process flow: 
  - `GET /booking/<public_id>/access` - Check booking access
  - `GET /booking/<public_id>/details` - Get booking details
  - `POST /booking/create` - Create new booking
  - `POST /booking/passengers` - Add passengers to booking
  - `POST /booking/confirm` - Confirm booking details
  - `POST /booking/payment` - Initiate payment
  - `GET /booking/payment/<public_id>/details` - Get payment details

**Controllers**
- `server/app/controllers/booking_controller.py`
- `server/app/controllers/booking_process_controller.py`
- `server/app/controllers/booking_passenger_controller.py`
- `server/app/controllers/passenger_controller.py`

**Booking State Machine**
- States: `created` → `passengers_added` → `confirmed` → `payment_pending` → `payment_confirmed` → `completed`
- Terminal states: `expired`, `cancelled`
- Failed states: `payment_failed`
- Page flow validation for UI navigation

---

## Payment Agent (YooKassa)

**Responsibilities**
- Create payments, handle confirmation (embedded/redirect), capture/cancel, and process webhooks.
- Manage payment status transitions and booking integration.

**Integration**
- YooKassa SDK (`yookassa`)
- Helper utilities: `server/app/utils/yookassa.py`
- Mock support for development/testing

**Key Model**
- **Payment**: `server/app/models/payment.py`
  - Integration with YooKassa payment IDs
  - Status tracking and webhook handling
  - Links to booking records

**Key endpoints**
- `GET /payments`, `POST /payments`, `PUT /payments/<id>`, `DELETE /payments/<id>`
- `POST /webhooks/yookassa` - YooKassa webhook handler

**Webhook events**
- `payment.waiting_for_capture` - Auto-capture authorized payments
- `payment.succeeded` - Mark booking as completed
- `payment.canceled` - Mark booking as payment failed

**Environment/config**
- `YOOKASSA_SHOP_ID`
- `YOOKASSA_SECRET_KEY`
- `YOOKASSA_USE_MOCK` (boolean)
- `YOOKASSA_API_URL` or mock via `YOOKASSA_MOCK_URL`

**Security and reliability**
- Webhook signature verification (per YooKassa docs)
- Idempotency handling for repeated webhook deliveries
- Automatic capture flow with booking number generation
- Payment status enum: `pending`, `waiting_for_capture`, `succeeded`, `canceled`

**Development helpers**
- Mock server integration: `yookassa/main.py`
- Functions: `create_payment()`, `capture_payment()`, `decline_payment()`, `send_notification()`

---

## Ticketing Agent

**Responsibilities**
- Generate and issue tickets upon successful payment.
- Tie ticket to booking and seat(s).
- Make ticket data available for email and user download.

**Key Model**
- **Ticket**: `server/app/models/ticket.py`
  - Links to booking, seat, and flight tariff
  - Ticket number generation
  - Status tracking

**Key endpoints**
- `GET /tickets`, `POST /tickets`, `PUT /tickets/<id>`, `DELETE /tickets/<id>`

**Controller**
- `server/app/controllers/ticket_controller.py`

**Dependencies**
- Triggers on Payment Agent success events
- Integrates with Seat Management for seat assignment

---

## Notifications Agent (Email)

**Responsibilities**
- Send transactional emails: registration, password reset, booking confirmations, payment updates, ticket issuance.

**Module**
- `server/app/utils/email.py` using `Flask-Mail`
  - `init_mail(app)` - Initialize mail with Flask app
  - `send_email(subject, recipients, template, **context)` - Send async email

**Configuration**
- `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `MAIL_USE_TLS`, `MAIL_USE_SSL`
- `MAIL_DEFAULT_SENDER`

**Templates**
- Location: `server/app/templates/`
- Jinja2 templating with context variables
- Support for both plain text and HTML

**Development setup**
- MailHog integration for local email testing
- Configuration in `.env`: `SERVER_MAIL_SERVER=mailhog`, `SERVER_MAIL_PORT=1025`

---

## Data Import Agent (Countries and Reference Data)

**Responsibilities**
- Bulk upload of reference data from Excel files.
- Template generation with localized field names.
- Data validation and error reporting.

**Supported entities**
- Countries, Airports, Airlines, Flights, Timezones

**Key features (example from Country model)**
- `get_xlsx_template()` - Generate Excel templates with localized headers
- `upload_from_file(file)` - Parse and import data with validation
- Error handling with row-level error reporting
- Localized field names (Russian): `Страна`, `Страна (англ)`, `Код A2`, `Код A3`

**Utilities**
- `server/app/utils/xlsx.py` - Excel parsing and template generation
- `parse_xlsx()` and `generate_xlsx_template()` functions

---

## Middlewares and Cross-cutting Concerns

**Error handling**
- `server/app/middlewares/error_handler.py` registered in `app.py`
- Standardized error responses for API clients

**Session handling**
- `server/app/middlewares/session_middleware.py`
- Session management and cleanup

**Authentication middleware**
- `server/app/middlewares/auth_middleware.py`
- Decorators: `@current_user`, `@login_required`, `@admin_required`, `@dev_tool`
- JWT token validation and user context injection

**CORS**
- Enabled in `app.py` via `flask_cors.CORS`
- Origins configured from `CLIENT_URL`

**Security**
- CSRF protection: `CSRF_ENABLED = True`
- JWT-based authentication with configurable expiry
- Role-based authorization (admin/standard users)

---

## Database and Migrations

**Setup**
- SQLAlchemy initialization: `server/app/database.py`
- Flask-Migrate/Alembic env: `server/migrations/env.py`
- Migration config: `server/migrations/alembic.ini`

**Development workflow**
- Generate migration: `flask db migrate -m "..."`
- Apply migration: `flask db upgrade`
- Downgrade: `flask db downgrade`

**Model discovery**
- Automatic model import via `__import_models()` in `app.py`
- Ensures all models are registered for migrations

---

## API Architecture

**Route registration**
- Centralized in `server/app/app.py`
- Function-based routing with explicit endpoint mapping
- Organized by domain (auth, users, bookings, payments, etc.)

**Response patterns**
- JSON responses with standardized error handling
- Pagination support where applicable
- Consistent error message format

**Authentication flow**
- Bearer token authentication via Authorization header
- User context injection through middleware decorators
- Role-based access control

---

## Security Model

**Authentication & Authorization**
- JWT tokens with configurable expiry (`JWT_EXP_HOURS`)
- Role-based access: admin vs standard users
- Protected endpoints via middleware decorators

**Input validation**
- Model-level validation in SQLAlchemy models
- Controller-level validation for business rules
- Excel upload validation with error reporting

**Secrets management**
- Environment-based configuration via `.env`
- Separate configurations for development/production
- YooKassa credentials management

**CSRF Protection**
- Enabled via `CSRF_ENABLED = True`
- Applies to forms and state-changing operations

---

## Observability and Operations

**Logging**
- Alembic migration logging: `server/migrations/alembic.ini`
- Flask application logging (framework default)
- Payment webhook logging in YooKassa utilities

**Recommended metrics**
- Booking conversion rates by status transitions
- Payment success/failure rates by provider
- Seat utilization and booking patterns
- Email delivery success rates

**Recommended alerts**
- Payment webhook failures and retries
- Database migration errors
- Email send failures
- Booking expiration and cleanup

---

## Development Environment

**Prerequisites**
- Docker and Docker Compose
- PostgreSQL database
- Redis (for session management)
- Python 3.x with Flask ecosystem

**Environment setup**
1. Copy `.example.env` to `.env`
2. Configure database, YooKassa, and email settings
3. Run `docker-compose build && docker-compose up -d`
4. Apply migrations: `docker-compose exec server-app flask db upgrade`
5. Create admin user (see README.md)

**Key environment variables**
```bash
# Server
SERVER_APP_ENV=dev
SERVER_CLIENT_URL=http://localhost:3000
SERVER_SECRET_KEY=your-secret-key
SERVER_JWT_EXP_HOURS=72
SERVER_DATABASE_URI=postgresql://user:pass@localhost:5432/avexmar

# Email (MailHog for development)
SERVER_MAIL_SERVER=mailhog
SERVER_MAIL_PORT=1025
SERVER_MAIL_DEFAULT_SENDER=noreply@example.com

# YooKassa
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
YOOKASSA_USE_MOCK=True
YOOKASSA_MOCK_URL=http://localhost:8050
```

**Development services**
- Frontend: React app on port 3000
- Backend: Flask app on port 5000
- Database: PostgreSQL on port 5432
- Email: MailHog on port 8025 (web UI)
- YooKassa Mock: Port 8050

**Testing**
- Test directory: `server/tests/`
- Run tests: `docker-compose run --rm server-app pytest -sv tests`
- Test database: Configured separately via `SERVER_TEST_DATABASE_URI`

---

## Domain States and Workflows

**Booking State Machine**
```
created → passengers_added → confirmed → payment_pending → payment_confirmed → completed
                                                     ↓
                                              payment_failed
                                                     ↓
                                              retry or cancel
```

**Terminal states**: `expired`, `cancelled`

**Payment Flow**
```
pending → waiting_for_capture → succeeded
                               ↓
                          canceled (on failure)
```

**Seat States**
- `available`: `booking_id IS NULL`
- `booked`: `booking_id IS NOT NULL` (derived property `is_booked`)

**Page Flow Validation**
- Each booking status defines accessible UI pages
- Prevents unauthorized access to booking steps
- Enforces sequential completion of booking process

---

## Client Integration

**Frontend architecture**
- React application in `client/` directory
- Admin interface for data management
- Customer booking interface
- Integration with backend APIs

**Admin features** (example from codebase)
- Bulk data management with Excel upload/download
- Entity CRUD operations (airlines, airports, etc.)
- Template generation for data imports
- Error handling and validation feedback

---

## External Integrations

**YooKassa Payment Gateway**
- Payment creation and capture flows
- Webhook handling for status updates
- Mock server for development/testing
- Support for multiple confirmation types

**Email Services**
- Flask-Mail for transactional emails
- MailHog for development email testing
- Async email sending to prevent blocking

---

## Performance Considerations

**Database optimization**
- Indexes on frequently queried fields (IATA codes, booking numbers)
- Foreign key constraints for data integrity
- Unique constraints for business rules

**Caching opportunities**
- Airport and airline reference data
- Flight search results
- Tariff and pricing calculations

**Async processing**
- Email sending via background threads
- Payment webhook processing
- Potential for background booking cleanup

---

## File Structure Reference

```
server/
├── app/
│   ├── app.py                  # Main application and route registration
│   ├── config.py              # Configuration management
│   ├── database.py            # SQLAlchemy setup
│   ├── controllers/           # Business logic controllers
│   │   ├── auth_controller.py
│   │   ├── booking_controller.py
│   │   ├── payment_controller.py
│   │   └── ...
│   ├── models/                # Data models
│   │   ├── booking.py
│   │   ├── payment.py
│   │   ├── user.py
│   │   └── ...
│   ├── middlewares/           # Request/response middleware
│   │   ├── auth_middleware.py
│   │   ├── error_handler.py
│   │   └── session_middleware.py
│   ├── utils/                 # Utility functions
│   │   ├── email.py
│   │   ├── yookassa.py
│   │   ├── jwt.py
│   │   └── ...
│   └── templates/             # Email templates
├── migrations/                # Database migrations
└── tests/                     # Test suite

yookassa/
└── main.py                    # Payment integration helpers

client/                        # React frontend application
```

---

## Troubleshooting

**Common issues**
- Database connection failures: Check `SERVER_DATABASE_URI`
- Payment webhook failures: Verify `YOOKASSA_SHOP_ID` and `YOOKASSA_SECRET_KEY`
- Email sending issues: Check MailHog container and mail configuration
- CORS errors: Verify `SERVER_CLIENT_URL` matches frontend URL

**Development tools**
- YooKassa mock server for payment testing
- MailHog for email verification
- PostgreSQL admin tools for database inspection
- Docker logs for debugging container issues

---

## Glossary

- **Flight Tariff**: Pricing product bound to a flight instance; carries seat inventory and fare rules
- **Fee**: Extra amount applied by application type (booking/change/cancel) and timing term
- **Capture**: Payment confirmation step to settle authorized funds
- **Webhook**: Asynchronous event callback from payment provider
- **Booking Number**: Human-readable identifier generated after payment authorization
- **Public ID**: UUID-based identifier for customer booking access
- **IATA/ICAO codes**: International aviation industry standard codes for airlines and airports

This documentation provides a comprehensive overview of the Avexmar airline booking system architecture, focusing on the logical separation of concerns into domain agents while maintaining practical implementation details for developers and operators.