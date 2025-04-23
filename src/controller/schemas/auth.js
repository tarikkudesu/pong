export const signinSchema = {
    body: {
        type: 'object',
        required: ['username', 'pass'],
        properties: {
            username: { type: 'string' },
            pass: { type: 'string' }
        },
        },
    };

export const signupSchema = {
    body: {
        type: 'object',
        required: ['username', 'email', 'pass'],
        properties: {
          username: { type: 'string' },
          email: { type: 'string' },
          pass: { type: 'string' },
        },
      },
    };

export const logoutSchema = {
    body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' },
        },
      },
    };