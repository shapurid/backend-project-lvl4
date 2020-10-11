import { omit, keys } from 'lodash';

export default (data, body) => {
  const validData = omit(body, ['password', ...keys(data)]);
  return { errors: data, ...validData };
};
