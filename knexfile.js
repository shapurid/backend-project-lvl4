const { join } = require('path');

const migrations = {
  directory: join(__dirname, 'server', 'migrations'),
};

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite',
    },
    migrations,
  },
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:',
    },
    migrations,
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations,
  },
};
