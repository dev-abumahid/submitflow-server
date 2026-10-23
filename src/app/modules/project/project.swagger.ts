const statusSchema = { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'REJECTED', 'APPROVED'] };

const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string' },
};

export const projectSwaggerDocs = {
  '/api/project': {
    post: {
      tags: ['project'],
      summary: 'Submit a new project (STUDENT)',
      description: 'New projects start as PENDING.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: JSON.stringify({
              name: 'Portfolio website',
              description: 'My personal portfolio built with React',
              gitRepoUrl: 'https://github.com/user/portfolio',
              previewUrl: 'https://portfolio.example.com',
            }),
          },
        },
      },
      responses: {
        201: { description: 'Project submitted successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Only students can submit projects' },
      },
    },
    get: {
      tags: ['project'],
      summary: 'Get projects (STUDENT: own projects, MENTOR: all projects)',
      description:
        'Students only see their own projects. Mentors see every project and can also filter by studentId and sort by createdAt.',
      parameters: [
        {
          name: 'searchTerm',
          in: 'query',
          required: false,
          description: 'Search by project name',
          schema: { type: 'string' },
        },
        { name: 'status', in: 'query', required: false, schema: statusSchema },
        { name: 'page', in: 'query', required: false, schema: { type: 'number', default: 1 } },
        { name: 'limit', in: 'query', required: false, schema: { type: 'number', default: 10 } },
        {
          name: 'studentId',
          in: 'query',
          required: false,
          description: 'MENTOR only',
          schema: { type: 'string' },
        },
        {
          name: 'sortOrder',
          in: 'query',
          required: false,
          description: 'MENTOR only, sorts by createdAt',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      ],
      responses: {
        200: { description: 'Projects fetched successfully' },
        400: { description: 'Invalid query' },
        401: { description: 'Unauthorized' },
      },
    },
  },

  '/api/project/{id}': {
    patch: {
      tags: ['project'],
      summary: 'Update own project (STUDENT)',
      description: 'Only allowed while the project is PENDING.',
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: JSON.stringify({ name: 'Portfolio website v2' }),
          },
        },
      },
      responses: {
        200: { description: 'Project updated successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        404: { description: 'Project not found' },
        409: { description: 'Project is no longer PENDING' },
      },
    },
    put: {
      tags: ['project'],
      summary: 'Review a project (MENTOR)',
      description: 'Updates the status and reviewer feedback.',
      parameters: [idParam],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            example: JSON.stringify({
              status: 'APPROVED',
              reviewerFeedBack: 'Great work, clean code!',
            }),
          },
        },
      },
      responses: {
        200: { description: 'Project reviewed successfully' },
        400: { description: 'Validation error' },
        401: { description: 'Unauthorized' },
        403: { description: 'Only mentors can review projects' },
        404: { description: 'Project not found' },
      },
    },
  },
};
