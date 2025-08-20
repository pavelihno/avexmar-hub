# Avexmar Hub - Coding Agent Navigation Guide

## Project Overview

Avexmar Hub is a comprehensive flight booking and management system built with a modern full-stack architecture. The application provides both customer-facing booking functionality and administrative management tools for airlines, airports, flights, and bookings.

### Core Technology Stack
- **Backend**: Flask 3.0.1 with SQLAlchemy ORM
- **Frontend**: React 18.3.1 with Redux Toolkit for state management
- **Database**: PostgreSQL 15 with Flask-Migrate for schema management
- **UI Framework**: Material-UI 5.18.0 with custom theming
- **Payment Processing**: YooKassa integration with mock service for development
- **Containerization**: Docker Compose for development environment
- **Testing**: pytest for backend, React Testing Library for frontend

## Architecture Overview

```
avexmar-hub/
├── client/                 # React.js frontend application
├── server/                 # Flask backend API
├── db/                     # Database initialization scripts
├── yookassa/               # Payment service mock
├── docker-compose.yml      # Container orchestration
└── .example.env           # Environment configuration template
```

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

## Frontend Architecture (`/client`)

### Directory Structure
```
client/src/
├── components/
│   ├── admin/            # Admin panel components
│   ├── auth/             # Authentication forms
│   ├── booking/          # Booking process components
│   ├── search/           # Flight search interface
│   ├── profile/          # User profile management
│   └── utils/            # Utility components and helpers
├── redux/
│   ├── actions/          # Redux action creators
│   ├── reducers/         # Redux reducers
│   └── store.js          # Redux store configuration
├── routes/
│   ├── AdminRoutes.js    # Protected admin routes
│   ├── PublicRoutes.js   # Public routes
│   └── ProtectedRoute.js # Route protection logic
├── context/              # React Context providers
├── constants/            # UI labels and validation messages
├── theme/                # Material-UI theme configuration
├── App.js                # Main application component
└── api.js                # Axios API client configuration
```

### Component Organization Patterns
- **Admin Components**: CRUD operations with data tables and forms
- **Booking Flow**: Multi-step process (Search → Schedule → Passengers → Confirmation → Payment → Completion)
- **Authentication**: Modal-based login/register with context management
- **Utility Components**: Reusable form inputs, mappers, validators

### State Management (Redux)
**Store Structure:**
```
state: {
  auth: { user, isAuthenticated, isAdmin }
  airports: { airports, isLoading, errors }
  airlines: { airlines, isLoading, errors }
  flights: { flights, isLoading, errors }
  bookings: { bookings, currentBooking, isLoading, errors }
  // ... other entities
}
```

**Action Patterns:**
- Async actions use Redux Thunk middleware
- Standard pattern: `fetchEntity`, `createEntity`, `updateEntity`, `deleteEntity`
- Loading states and error handling built into each reducer

### Routing Structure
- **Public Routes**: Home, search, booking process, authentication
- **Admin Routes**: Management panels for all entities, protected by admin role
- **Protected Routes**: HOC pattern for route-based access control

## Development Workflow

### Environment Setup
1. Copy `.example.env` to `.env` and configure variables
2. Start services: `docker-compose build && docker-compose up -d`
3. Initialize database: `docker-compose exec server-app flask db upgrade`
4. Create admin user (see README.md for command)

### Common Development Tasks

**Backend Development:**
```bash
# Create new migration
docker-compose exec server-app flask db migrate -m "description"

# Apply migrations
docker-compose exec server-app flask db upgrade

# Run tests
docker-compose run --rm server-app pytest -sv tests

# Access Python shell in container
docker-compose exec server-app python
```

**Frontend Development:**
```bash
# Install new dependency
docker-compose exec client-app npm install <package-name> --save

# Run in watch mode (already configured in docker-compose)
# Changes auto-reload via volume mounting

# Access Node.js container
docker-compose exec client-app sh
```

### Database Operations
```bash
# Drop and recreate database
docker-compose exec server-app python -c "
from app.app import app, db
with app.app_context():
    db.drop_all()
    db.metadata.reflect(bind=db.engine)
    db.metadata.drop_all(bind=db.engine)
    with db.engine.connect() as conn:
        conn.execute(db.text('DROP TABLE IF EXISTS alembic_version;'))
"

# Access database via Adminer
# Navigate to http://localhost:8082
```

## Code Patterns and Conventions

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

### Frontend Patterns
**Component Structure:**
```javascript
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const ComponentName = () => {
    const dispatch = useDispatch();
    const { data, isLoading, errors } = useSelector(state => state.entityName);
    
    useEffect(() => {
        dispatch(fetchEntities());
    }, [dispatch]);
    
    return (
        // JSX
    );
};
```

**Redux Action Pattern:**
```javascript
export const fetchEntities = () => async (dispatch) => {
    dispatch(setLoading(true));
    try {
        const response = await api.get('/entities');
        dispatch(setEntities(response.data));
    } catch (error) {
        dispatch(setError(error.message));
    } finally {
        dispatch(setLoading(false));
    }
};
```

### Data Mapping Patterns
The application uses consistent mapping between API and UI formats:
```javascript
// client/src/components/utils/mappers.js
export const mappingConfigs = {
    entityName: [
        ['api_field_name', 'uiFieldName'],
        ['another_api_field', 'anotherUiField'],
    ]
};
```

## Testing Guidelines

### Backend Testing
- Use pytest with Flask test client
- Test configuration in `conftest.py`
- Follow AAA pattern (Arrange, Act, Assert)
- Test both success and error scenarios

### Frontend Testing
- React Testing Library for component testing
- Test user interactions and state changes
- Mock API calls using MSW or similar

## Payment Integration

The application integrates with YooKassa for payment processing:
- Development uses mock service (`yookassa/main.py`)
- Production uses real YooKassa API
- Configuration via environment variables
- Webhook handling for payment status updates

## Admin Panel Architecture

The admin panel provides comprehensive management functionality:
- **Data Tables**: Sortable, filterable tables with CRUD operations
- **Form Generation**: Dynamic forms based on field configurations
- **Role Protection**: All admin routes require admin role
- **Bulk Operations**: Mass delete and update capabilities

**Admin Modules:**
- Airports, Airlines, Aircraft management
- Route and Flight scheduling
- Tariff and Discount configuration
- Booking and Passenger management
- User administration

## Booking Process Flow

The booking process follows a multi-step wizard pattern:
1. **Search**: Flight search with filters
2. **Schedule**: Flight selection and seat choice
3. **Passengers**: Passenger information collection
4. **Confirmation**: Booking details review
5. **Payment**: Payment processing
6. **Completion**: Booking confirmation and ticket generation

Each step maintains state in Redux and validates before progression.

## Common Troubleshooting

### Database Issues
- **Migration Conflicts**: Reset migrations if needed, backup data first
- **Connection Issues**: Check PostgreSQL container status and credentials
- **Data Integrity**: Use foreign key constraints and validation in models

### Authentication Issues
- **JWT Expiration**: Check `SERVER_JWT_EXP_HOURS` configuration
- **Role Access**: Verify user roles in database
- **CORS Errors**: Ensure `SERVER_CLIENT_URL` matches frontend URL

### Container Issues
- **Port Conflicts**: Check for conflicting services on ports 3000, 5000, 5432
- **Volume Mounting**: Ensure proper file permissions for volume mounts
- **Environment Variables**: Verify `.env` file configuration

### Performance Considerations
- **Database Queries**: Use eager loading for relationships where appropriate
- **Frontend Rendering**: Implement pagination for large datasets
- **API Response Times**: Consider caching for frequently accessed data

## Security Considerations

- **Input Validation**: Validate all user inputs on both frontend and backend
- **SQL Injection**: Use SQLAlchemy ORM properly, avoid raw SQL
- **XSS Protection**: Sanitize user-generated content
- **Authentication**: Secure JWT handling and storage
- **Authorization**: Proper role-based access control implementation

## Extension Guidelines

When adding new features:
1. **Backend**: Create model → controller → routes in `app.py`
2. **Frontend**: Create components → Redux actions/reducers → routes
3. **Admin Panel**: Add management interface if needed
4. **Tests**: Write tests for new functionality
5. **Documentation**: Update this guide for significant changes

This guide provides the essential information needed for coding agents to navigate and contribute to the Avexmar Hub codebase effectively.