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

## Development

### Add ReactJS Dependencies

```bash
docker-compose exec client-app npm install <package-name> --save-prod
docker-compose exec client-app npm i --package-lock-only
```

### Create and Apply Flask Migrations

```bash
# Initialize migrations (first time only)
docker-compose exec server-app flask db init

# Create a new migration
docker-compose exec server-app flask db migrate -m <migration-message>

# Apply migrations
docker-compose exec server-app flask db upgrade
```

### Drop Database

Run the following command to drop the database:

```bash
docker-compose exec server-app python -c "
from app.app import app, db

with app.app_context():
    db.drop_all()
    db.metadata.reflect(bind=db.engine)
    db.metadata.drop_all(bind=db.engine)

    with db.engine.connect() as conn:
        conn.execute(db.text('DROP TABLE IF EXISTS alembic_version;'))
"
```

### Fix _migrations/versions_ permissions

```bash
sudo chown -R $USER:$USER server/migrations/versions
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

### Cloudflare Tunnel Setup

Client App:

```bash
cloudflared tunnel --url http://localhost:3000 --protocol http2
```

Server App:

```bash
cloudflared tunnel --url http://localhost:8000 --protocol http2
```

### Merge into prod/main branch

```bash
git checkout <target_branch>
git merge --no-commit <source_branch>
```
