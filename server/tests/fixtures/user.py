import pytest
from app.models.user import User
from app.utils.jwt import signJWT
from app.config import Config


@pytest.fixture
def admin_user():
    """Create and return an admin user"""
    return User.create(
        email='admin@example.com',
        password='admin',
        role=Config.USER_ROLE.admin,
        is_active=True
    )


@pytest.fixture
def standard_user():
    """Create and return a standard user"""
    return User.create(
        email='user@example.com',
        password='password',
        role=Config.USER_ROLE.standard,
        is_active=True
    )


@pytest.fixture
def inactive_user():
    """Create and return an inactive user"""
    return User.create(
        email='inactive@example.com',
        password='password',
        role=Config.USER_ROLE.standard,
        is_active=False
    )


@pytest.fixture
def admin_token(admin_user):
    """Return an admin JWT token"""
    return signJWT(admin_user.email)


@pytest.fixture
def admin_headers(admin_token):
    """Return Authorization headers with admin token"""
    return {'Authorization': f'Bearer {admin_token}'}


@pytest.fixture
def user_token(standard_user):
    """Return a standard user JWT token"""
    return signJWT(standard_user.email)


@pytest.fixture
def user_headers(user_token):
    """Return Authorization headers with user token"""
    return {'Authorization': f'Bearer {user_token}'}
