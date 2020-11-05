import { Model } from 'objection';
import { join } from 'path';

export default class Task extends Model {
  static get tableName() {
    return 'tasks';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name', 'taskStatusId', 'creatorId'],
      properties: {
        id: {
          type: 'integer',
          minimum: -2147483648,
          maximum: +2147483647,
        },
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 255,
        },
        description: {
          type: ['string', 'null'],
          maxLength: 255,
        },
        taskStatusId: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
        creatorId: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
        executorId: {
          type: ['integer', 'null'],
          minimum: -2147483648,
          maximum: +2147483647,
        },
      },
    };
  }

  static get relationMappings() {
    return {
      taskStatus: {
        relation: Model.BelongsToOneRelation,
        modelClass: join(__dirname, 'TaskStatus'),
        join: {
          from: 'tasks.taskStatusId',
          to: 'task_statuses.id',
        },
      },
      creator: {
        relation: Model.BelongsToOneRelation,
        modelClass: join(__dirname, 'User'),
        join: {
          from: 'tasks.creatorId',
          to: 'users.id',
        },
      },
      executor: {
        relation: Model.BelongsToOneRelation,
        modelClass: join(__dirname, 'User'),
        join: {
          from: 'tasks.executorId',
          to: 'users.id',
        },
      },
      labels: {
        relation: Model.ManyToManyRelation,
        modelClass: join(__dirname, 'Label'),
        join: {
          from: 'tasks.id',
          through: {
            from: 'task_labels.taskId',
            to: 'task_labels.labelId',
          },
          to: 'labels.id',
        },
      },
    };
  }
}
