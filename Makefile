setup:
	npm install

build:
	npm run build

migrate:
	npx knex migrate:latest

rebuild:
	rm -rf database.sqlite && make set-db

start:
	heroku local -f Procfile.dev

start-backend:
	npx nodemon --exec npx babel-node server/bin/server.js

start-frontend:
	npx webpack-dev-server

test:
	npm test

lint:
	npx eslint .

lint-fix:
	npx eslint . --fix