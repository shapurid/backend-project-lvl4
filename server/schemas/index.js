import session from './session';
import users from './users';

const schemas = [
  session,
  ...users,
];

export default (app) => schemas.forEach((schema) => app.addSchema(schema));
