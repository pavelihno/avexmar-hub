# Avexmar Hub Guide

## Production Setup

Follow these steps for the production setup of the application:

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
from app.utils.enum import USER_ROLE
from app.models.user import User

with app.app_context():
    admin = User.create(
        commit=True, 
        **{
            'email': 'admin',
            'password': '1234',
            'role': USER_ROLE.admin,
            'is_active': True
        }
    )
    if not admin:
        print('Failed to create admin user')
    else:
        print('Admin user created successfully')
"
```

Replace `'1234'` with a strong password if necessary.
