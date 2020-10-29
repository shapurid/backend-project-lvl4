import welcome from './welcome';
import users from './users';
import session from './session';
import notFound from './notFound';
import taskStatuses from './taskStatuses';
import tasks from './tasks';
import labels from './labels';

const controllers = [
  welcome,
  users,
  session,
  taskStatuses,
  tasks,
  labels,
  notFound,
];

export default (app) => controllers.forEach((f) => f(app));
