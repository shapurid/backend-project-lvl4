import { keyBy } from 'lodash';

const handleError = (error) => {
  const normalizeData = error.validation.map(({ dataPath }) => dataPath.slice(1));
  return keyBy(normalizeData);
};

export default class extends Error {
  constructor(validationError, ...args) {
    super(...args);
    this.data = handleError(validationError);
    this.type = 'SchemaError';
  }
}
