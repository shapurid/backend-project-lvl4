import { keyBy } from 'lodash';

const normalizeErrorData = (error) => {
  const normalizedData = error.validation.map(({ dataPath }) => dataPath.slice(1));
  return keyBy(normalizedData);
};

export default class extends Error {
  constructor(validationError, ...args) {
    super(...args);
    this.data = normalizeErrorData(validationError);
    this.type = 'SchemaError';
  }
}
