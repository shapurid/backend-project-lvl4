import { Model } from 'objection';
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

  get name() {
    return `${this.firstName} ${this.lastName}`;
  }

  set password(value) {
    this.passwordDigest = encrypt(value);
  }
}
