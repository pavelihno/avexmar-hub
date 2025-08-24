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

## Code Style Guide (Global)

- Prefer single quotes over double quotes in both Python and JavaScript/TypeScript.
- Keep lines to 100–120 chars; wrap long literals and arguments.
- Always return JSON responses with a consistent shape: { message, data?, errors? }.
- Use descriptive, kebab-case URLs and snake_case in Python, camelCase in JS.

Recommended tooling configuration (to add to the repo):

- .prettierrc

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always"
}
```

- .eslintrc.json

```json
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "quotes": ["error", "single"],
    "jsx-quotes": ["error", "prefer-single"]
  }
}
```

- pyproject.toml (Ruff)

```toml
[tool.ruff]
line-length = 100
select = ["E", "F", "Q", "I"]

[tool.ruff.lint.flake8-quotes]
inline-quotes = "single"
multiline-quotes = "single"
docstring-quotes = "double"
```

- .editorconfig

```
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 2
quote_type = single
```

## Contributor Checklist (Patterns & Style)

Before merging:

- Quotes: single quotes in Python and JS; template literals only when needed in JS.
- Controllers: CRUD endpoints follow naming and status code conventions; mutations protected with `@admin_required`.
- Special flows: booking/auth/search endpoints use the appropriate decorators and live under clear route groups.
- Responses: consistent JSON shape with `message` and/or `errors` where applicable.
- Redux: use `createCrudActions` + `addCrudCases` for CRUD modules; keep loading/error patterns consistent.
- Client: call serverApi only within Redux actions and reducers.
- Lint/format: run ESLint, Prettier, and Ruff; fix quote violations.

## Email Guidelines

- Every outbound email must have both plain-text and HTML templates with matching filenames.
- HTML templates extend `email/html/_base.html`; text templates live in `email/txt`.
- Keep content consistent between formats and use Jinja placeholders for variables.
