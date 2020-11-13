import { Model } from 'objection';
import { join } from 'path';
import objectionUnique from 'objection-unique';
import encrypt from '../lib/encrypt';

const unique = objectionUnique({ fields: ['email'] });

export default class User extends unique(Model) {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        id: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
        firstName: {
          type: 'string',
          minLength: 1,
          maxLength: 255,
        },
        lastName: {
          type: 'string',
          minLength: 1,
          maxLength: 255,
        },
        email: {
          type: 'string',
          format: 'email',
          maxLength: 255,
        },
        password: {
          type: 'string',
          minLength: 3,
          maxLength: 255,
        },
      },
    };
  }

  static get relationMappings() {
    return {
      tasksCreator: {
        relation: Model.HasManyRelation,
        modelClass: join(__dirname, 'Task'),
        join: {
          from: 'users.id',
          to: 'tasks.creatorId',
        },
      },
      tasksExecutor: {
        relation: Model.HasManyRelation,
        modelClass: join(__dirname, 'Task'),
        join: {
          from: 'users.id',
          to: 'tasks.executorId',
        },
      },
    };
  }

  get name() {
    return `${this.firstName} ${this.lastName}`;
  }

  set password(value) {
    this.passwordDigest = encrypt(value);
  }
}
