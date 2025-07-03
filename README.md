# Guide

### Build and Run
```
docker-compose build
docker-compose up
```

### Add ReactJS dependencies
```
npm install <package-name> --save-prod
npm i --package-lock-only
```

### Create Flask migrations

Inside Docker container:
```
flask db init
flask db migrate -m <migration-message>
flask db upgrade
```

### Run Backend Tests

Backend tests are written with **pytest**. The test suite relies on environment variables defined in `.example.env` and additional overrides in `server/tests/test.env`.
Use Docker to execute the tests in an isolated environment:

```
docker-compose run --rm server pytest -q
```

This command installs the required dependencies and executes the tests inside the server container.

