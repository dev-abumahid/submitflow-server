import { Prisma } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { bearer, makeAccount } from '../helpers/fixtures.js';
import { prismaMock } from '../helpers/prisma.js';

const BASE = '/api/project';
const db = prismaMock.project;

const student = makeAccount({ id: 'student-1', role: 'STUDENT' });
const mentor = makeAccount({ id: 'mentor-1', email: 'mentor@example.com', role: 'MENTOR' });

/** Signs the request in as `account` (the auth middleware looks it up). */
const as = (account: typeof student) => {
  prismaMock.account.findUnique.mockResolvedValue(account);
  return bearer(account);
};

const createPayload = {
  name: 'Portfolio website',
  description: 'My personal portfolio',
  gitRepoUrl: 'https://github.com/user/portfolio',
  previewUrl: 'https://portfolio.example.com',
};

const row = {
  id: '9b2f3c1e-7a41-4c8e-9d6b-2f4e8a1c5b70',
  ...createPayload,
  status: 'PENDING',
  reviewerFeedBack: null,
  submitterId: student.id,
  reviewerId: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const recordNotFound = () =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });

const api = () => request(app);

describe(`POST ${BASE}`, () => {
  it('lets a student submit a project', async () => {
    db.create.mockResolvedValue(row);

    const res = await api().post(BASE).set('Authorization', as(student)).send(createPayload);

    expect(res.status).toBe(201);
    expect(db.create).toHaveBeenCalledWith({
      data: { ...createPayload, submitterId: student.id },
    });
  });

  it('rejects an invalid body', async () => {
    const res = await api()
      .post(BASE)
      .set('Authorization', as(student))
      .send({ ...createPayload, gitRepoUrl: 'javascript:alert(1)' });

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('is forbidden for mentors', async () => {
    const res = await api().post(BASE).set('Authorization', as(mentor)).send(createPayload);

    expect(res.status).toBe(403);
  });

  it('requires sign in', async () => {
    const res = await api().post(BASE).send(createPayload);

    expect(res.status).toBe(401);
  });
});

describe(`PATCH ${BASE}/:id`, () => {
  const url = `${BASE}/${row.id}`;

  it('updates a PENDING project of the student', async () => {
    db.updateMany.mockResolvedValue({ count: 1 });
    db.findUnique.mockResolvedValue({ ...row, name: 'New name' });

    const res = await api().patch(url).set('Authorization', as(student)).send({ name: 'New name' });

    expect(res.status).toBe(200);
    expect(db.updateMany).toHaveBeenCalledWith({
      where: { id: row.id, submitterId: student.id, status: 'PENDING' },
      data: { name: 'New name' },
    });
  });

  it('is 409 once the project left PENDING', async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    db.findFirst.mockResolvedValue({ status: 'IN_PROGRESS' });

    const res = await api().patch(url).set('Authorization', as(student)).send({ name: 'New name' });

    expect(res.status).toBe(409);
  });

  it('is 404 for a project of another student', async () => {
    db.updateMany.mockResolvedValue({ count: 0 });
    db.findFirst.mockResolvedValue(null);

    const res = await api().patch(url).set('Authorization', as(student)).send({ name: 'New name' });

    expect(res.status).toBe(404);
  });

  it('rejects an empty body', async () => {
    const res = await api().patch(url).set('Authorization', as(student)).send({});

    expect(res.status).toBe(400);
    expect(db.updateMany).not.toHaveBeenCalled();
  });
});

describe(`PUT ${BASE}/:id`, () => {
  const url = `${BASE}/${row.id}`;
  const review = { status: 'APPROVED', reviewerFeedBack: 'Great work' };

  it('lets a mentor review a project', async () => {
    db.update.mockResolvedValue({ ...row, ...review, reviewerId: mentor.id });

    const res = await api().put(url).set('Authorization', as(mentor)).send(review);

    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: row.id },
        data: { ...review, reviewerId: mentor.id },
      }),
    );
  });

  it('does not allow moving a project back to PENDING', async () => {
    const res = await api().put(url).set('Authorization', as(mentor)).send({ status: 'PENDING' });

    expect(res.status).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('is 404 when the project does not exist', async () => {
    db.update.mockRejectedValue(recordNotFound());

    const res = await api().put(url).set('Authorization', as(mentor)).send(review);

    expect(res.status).toBe(404);
  });

  it('is forbidden for students', async () => {
    const res = await api().put(url).set('Authorization', as(student)).send(review);

    expect(res.status).toBe(403);
  });
});

describe(`GET ${BASE}`, () => {
  it('returns only the student own projects, with filters and pagination', async () => {
    db.findMany.mockResolvedValue([row]);
    db.count.mockResolvedValue(11);

    const res = await api()
      .get(`${BASE}?searchTerm=port&status=PENDING&page=2&limit=5&studentId=${mentor.id}`)
      .set('Authorization', as(student));

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 2, limit: 5, total: 11 });
    const where = {
      submitterId: student.id,
      name: { contains: 'port', mode: 'insensitive' },
      status: 'PENDING',
    };
    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where, orderBy: { createdAt: 'desc' }, skip: 5, take: 5 }),
    );
  });

  it('returns every project to a mentor, filtered by student and sorted', async () => {
    db.findMany.mockResolvedValue([row]);
    db.count.mockResolvedValue(1);

    const res = await api()
      .get(`${BASE}?studentId=${row.id}&sortOrder=asc`)
      .set('Authorization', as(mentor));

    expect(res.status).toBe(200);
    expect(db.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { submitterId: row.id },
        orderBy: { createdAt: 'asc' },
        skip: 0,
        take: 10,
      }),
    );
  });

  it('rejects an invalid query', async () => {
    const res = await api().get(`${BASE}?status=DONE`).set('Authorization', as(mentor));

    expect(res.status).toBe(400);
  });
});
