import { Model } from 'objection';

export default class TaskLabel extends Model {
  static get tableName() {
    return 'task_labels';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['taskId', 'labelId'],
      properties: {
        taskId: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
        labelId: {
          type: 'integer',
          minimum: -2147483648,
          maximum: 2147483647,
        },
      },
    };
  }
}
