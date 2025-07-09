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

### Run Server Tests


Run the server:
```
docker-compose up -d
```

Run all tests:
```
docker-compose run --rm server-app pytest -sv tests
```

