# Avexmar Hub Guide

## First Time Setup

Follow these steps for the initial setup of the application:

### 1. Environment Configuration

Create a new file named `.env` by copying the contents from the `.env.example` file.

Edit the `.env` file with your specific configuration values.

### 2. Build and Start Containers

```bash
docker-compose build
docker-compose up -d
```

### 3. Initialize Database

Run migrations inside the server container:

```bash
docker-compose exec server-app flask db upgrade
```

### 4. Create Admin User

Run the following command to create an admin user:

```bash
docker-compose exec server-app python -c "
from app.app import app
from app.config import Config
from app.models.user import User

with app.app_context():
    admin = User.create(**{
        'email': 'admin',
        'password': '1234',
        'role': Config.USER_ROLE.admin,
        'is_active': True
    })
    if not admin:
        print('Failed to create admin user')
    else:
        print('Admin user created successfully')
"
```

Replace `'1234'` with a strong password if necessary.

## Development

### Add ReactJS Dependencies

```bash
npm install <package-name> --save-prod
npm i --package-lock-only
```

### Create Flask Migrations

Inside Docker container:

```bash
# Initialize migrations (first time only)
flask db init

# Create a new migration
flask db migrate -m <migration-message>

# Apply migrations
flask db upgrade
```

### Run Server Tests

Start the server:

```bash
docker-compose up -d
```

Run all tests:

```bash
docker-compose run --rm server-app pytest -sv tests
```
