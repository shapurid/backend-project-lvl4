import welcome from './welcome';
import users from './users';
import session from './session';
import notFound from './notFound';
import taskStatuses from './taskStatuses';

const controllers = [
  welcome,
  users,
  session,
  taskStatuses,
  notFound,
];

export default (app) => controllers.forEach((f) => f(app));
