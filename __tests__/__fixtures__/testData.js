import users from './users.json';
import taskStatuses from './taskStatuses.json';
import labels from './labels.json';
import tasks from './tasks.json';

export default {
  dataForDb: {
    user1: users.dbUser1,
    user2: users.dbUser2,
    taskStatus1: taskStatuses.dbTaskStatus1,
    taskStatus2: taskStatuses.dbTaskStatus2,
    label: labels.dbLabel,
    task: tasks.dbTask,
  },
  dataForTests: {
    labels: {
      create: labels.testLabel,
      update: labels.testLabelUpdate,
    },
    tasks: {
      create: tasks.testTask,
    },
    taskStatuses: {
      create: taskStatuses.testTaskStatus,
      update: taskStatuses.testTaskStatusUpdate,
    },
    users: {
      user: {
        data: users.testUser,
      },
      update: users.testUserUpdate,
    },
  },
};
