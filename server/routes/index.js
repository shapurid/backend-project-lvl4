import welcome from './welcome';
import users from './users';

const controllers = [
  welcome,
  users,
];

export default (app) => controllers.forEach((f) => f(app));
