import { mapValues } from 'lodash';

export default (body) => {
  const emptyStringsToNulls = mapValues(body, (el) => (el.length > 0 ? el : null));
  return mapValues(emptyStringsToNulls, (el) => {
    const transformedValue = Number.parseInt(el, 10);
    if (Number.isNaN(transformedValue)) {
      return el;
    }
    return transformedValue;
  });
};
