import faker from 'faker';

export default {
  'labels.test': {
    create: {
      name: faker.lorem.word(),
    },
    update: {
      name: faker.lorem.word(),
    },
  },
  'tasks.test': {
    create: {
      name: faker.lorem.word(),
    },
  },
  'taskStatuses.test': {
    create: {
      name: faker.lorem.word(),
    },
    update: {
      name: faker.lorem.word(),
    },
  },
  'users.test': {
    user: {
      data: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
      },
    },
    updationData: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    },
    newData: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    },
  },
};
