import i18next from 'i18next';
import _ from 'lodash';

export default (app) => ({
  route(name, args) {
    return app.reverse(name, args);
  },
  _,
  t(key) {
    return i18next.t(key);
  },
});
