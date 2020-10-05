setup:
	npm install

build:
	npm run build

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

fix:
	npx eslint . --fix