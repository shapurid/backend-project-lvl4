export default [
  {
    $id: 'userRegistrationSchema',
    type: 'object',
    required: ['firstName', 'lastName', 'email', 'password'],
    properties: {
      firstName: {
        type: 'string',
        minLength: 1,
      },
      lastName: {
        type: 'string',
        minLength: 1,
      },
      email: {
        type: 'string',
        format: 'email',
      },
      password: {
        type: 'string',
        minLength: 3,
      },
    },
  },
  {
    $id: 'userUpdateSchema',
    type: 'object',
    required: ['password'],
    properties: {
      firstName: {
        type: 'string',
        minLength: 1,
      },
      lastName: {
        type: 'string',
        minLength: 1,
      },
      email: {
        type: 'string',
        format: 'email',
      },
      newPassword: {
        type: 'string',
        minLength: 3,
      },
      password: {
        type: 'string',
        minLength: 3,
      },
      _method: {
        type: 'string',
      },
    },
  },
];
