import generateUserData from './generateUserData';
import generateName from './generateName';

export default {
  labels: {
    create: {
      name: generateName(),
    },
    update: {
      name: generateName(),
    },
  },
  tasks: {
    create: {
      name: generateName(),
    },
  },
  taskStatuses: {
    create: {
      name: generateName(),
    },
    update: {
      name: generateName(),
    },
  },
  users: {
    user: {
      data: generateUserData(),
    },
    dataToUpdate: generateUserData(),
    newData: generateUserData(),
  },
};
