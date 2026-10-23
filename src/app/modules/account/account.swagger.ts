export const accountSwaggerDocs = {
  '/api/auth/sign-up': {
    post: {
      tags: ['auth'],
      summary: 'Create  new account',
      description: '',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: JSON.stringify({
              email: 'user@gmail.com',
              password: 'password',
              fullName: 'User',
            }),
          },
        },
      },
      responses: {
        201: { description: 'account created successfully' },
        500: { description: 'Validation error or internal server error' },
      },
    },
  },
  '/api/auth/sign-in': {
    post: {
      tags: ['auth'],
      summary: 'Sign In your account',
      description: '',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: JSON.stringify({
              email: 'user@gmail.com',
              password: 'password',
            }),
          },
        },
      },
      responses: {
        201: { description: 'User signed in successfully' },
        500: { description: 'Validation error or internal server error' },
      },
    },
  },
  '/api/auth/me': {
    get: {
      tags: ['auth'],
      summary: 'Get me account',
      description: '',
      responses: {
        200: { description: 'account fetched successfully' },
        401: { description: 'unauthorized' },
      },
    },
  },
  '/api/auth/change-password': {
    put: {
      tags: ['auth'],
      summary: 'Change Password',
      description: '',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: JSON.stringify({
              oldPassword: '123456',
              newPassword: '654321',
            }),
          },
        },
      },
      responses: {
        201: { description: 'Passwrod change successfully' },
        500: { description: 'Validation error or internal server error' },
      },
    },
  },
  '/api/auth/refresh-token': {
    post: {
      tags: ['auth'],
      summary: 'Get a new access token (and a rotated refresh token)',
      description:
        'Browsers send the `refresh_token` cookie automatically; other clients send it in the body. ' +
        'Every call returns a new refresh token and invalidates the old one. Reusing an old ' +
        'refresh token ends the whole session.',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            example: JSON.stringify({ refreshToken: 'only-for-non-browser-clients' }),
          },
        },
      },
      responses: {
        200: { description: '{ accessToken, refreshToken }, both also set as httpOnly cookies' },
        401: { description: 'Missing, invalid, expired or reused refresh token' },
      },
    },
  },
  '/api/auth/sign-out': {
    post: {
      tags: ['auth'],
      summary: 'Sign out this device (revokes its refresh token, clears the cookies)',
      responses: { 200: { description: 'Signed out' } },
    },
  },
  '/api/auth/sign-out-all': {
    post: {
      tags: ['auth'],
      summary: 'Sign out from all devices (revokes every access token)',
      responses: {
        200: { description: 'Signed out everywhere' },
        401: { description: 'unauthorized' },
      },
    },
  },
};
