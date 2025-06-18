export const signinSchema = {
    body: {
        type: 'object',
        required: ['username', 'pass'],
        properties: {
          username: { type: 'string', pattern: '^[^<>]*$' },
          pass: { type: 'string', pattern: '^[^<>]*$' }
        },
      },
    };

export const signupSchema = {
    body: {
        type: 'object',
        required: ['username', 'email', 'pass'],
        properties: {
          username: { type: 'string', pattern: '^[^<>]*$' },
          email: { type: 'string', pattern: '^[^<>]*$' },
          pass: { type: 'string', pattern: '^[^<>]*$' }
        },
      },
    };

export const logoutSchema = {
    body: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string', pattern: '^[^<>]*$' },
        },
      },
    };

export const otpSchema = {
    body: {
        type: 'object',
        required: ['otp'],
        properties: {
          otp: { type: 'string', pattern: '^\\d{6}$' }
        }
      }
    };
    