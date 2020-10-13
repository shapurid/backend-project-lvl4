import welcome from './welcome';
import users from './users';
import session from './session';
import notFound from './notFound';

const controllers = [
  welcome,
  users,
  session,
  notFound,
];

export default (app) => controllers.forEach((f) => f(app));
