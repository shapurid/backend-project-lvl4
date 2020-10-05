const path = require('path');

const migrations = {
  directory: path.resolve('server', 'migrations'),
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
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite',
    },
    migrations,
  },
};
