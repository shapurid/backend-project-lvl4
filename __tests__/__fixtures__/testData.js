import dbUser1 from './users/dbUser1.json';
import dbUser2 from './users/dbUser2.json';
import testUser from './users/testUser.json';
import testUserUpdate from './users/testUserUpdate.json';
import dbTaskStatus from './taskStatuses/dbTaskStatus.json';
import testTaskStatus from './taskStatuses/testTaskStatus.json';
import testTaskStatusUpdate from './taskStatuses/testTaskStatusUpdate.json';
import dbLabel from './labels/dbLabel.json';
import testLabel from './labels/testLabel.json';
import testLabelUpdate from './labels/testLabelUpdate.json';
import dbTask from './tasks/dbTask.json';
import testTask from './tasks/testTask.json';
import testTaskUpdate from './tasks/testTaskUpdate.json';

export default {
  dataForDb: {
    user1: dbUser1,
    user2: dbUser2,
    taskStatus: dbTaskStatus,
    label: dbLabel,
    task: dbTask,
  },
  dataForTests: {
    labels: {
      create: testLabel,
      update: testLabelUpdate,
    },
    tasks: {
      create: testTask,
      update: testTaskUpdate,
    },
    taskStatuses: {
      create: testTaskStatus,
      update: testTaskStatusUpdate,
    },
    users: {
      user: {
        data: testUser,
      },
      update: testUserUpdate,
    },
  },
};
