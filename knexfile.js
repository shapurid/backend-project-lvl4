const { resolve } = require('path');

const migrations = {
  directory: resolve('server', 'migrations'),
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
    connection: ':memory:',
    migrations,
  },
  production: {
    client: 'pg',
    version: '12.4',
    connection: process.env.DATABASE_URL,
    migrations,
  },
};
