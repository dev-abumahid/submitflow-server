export const projectSwaggerDocs = {
  '/api/project': {
    post: {
      tags: ['project'],
      summary: 'Create new project',
      description: '',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: JSON.stringify({ name: 'Example project' }),
          },
        },
      },
      responses: {
        201: { description: 'project created successfully' },
        500: { description: 'Validation error or internal server error' },
      },
    },
    get: {
      tags: ['project'],
      summary: 'Get all project',
      description: '',
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: { type: 'number' },
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: { type: 'number' },
        },
      ],
      responses: {
        200: { description: 'project fetched successfully' },
        401: { description: 'unauthorized' },
      },
    },
  },

  '/api/project/{id}': {
    get: {
      tags: ['project'],
      summary: 'Get single project',
      description: '',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: { description: 'project fetched successfully' },
        401: { description: 'unauthorized' },
      },
    },
    patch: {
      tags: ['project'],
      summary: 'Update project',
      description: '',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: JSON.stringify({ name: 'Example project' }),
          },
        },
      },
      responses: {
        200: { description: 'project updated successfully' },
        500: { description: 'Validation error or internal server error' },
      },
    },
    delete: {
      tags: ['project'],
      summary: 'Delete project',
      description: '',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      responses: {
        200: { description: 'project deleted successfully' },
        401: { description: 'unauthorized' },
      },
    },
  },
};
