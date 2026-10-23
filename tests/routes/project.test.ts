import { Prisma } from '@prisma/client';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app.js';
import { prismaMock } from '../helpers/prisma.js';

// Starter tests for the generated CRUD routes: extend them with your own rules.
const BASE = '/api/project';
const db = prismaMock.project;

// Valid request bodies, matching project.validation.ts. Update them with your fields.
const createPayload = { name: 'Example project' };
const updatePayload = { name: 'Updated project' };

// a row as the database would return it
const row = {
  id: '9b2f3c1e-7a41-4c8e-9d6b-2f4e8a1c5b70',
  ...createPayload,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};
// ...and as it looks in a JSON response
const json = JSON.parse(JSON.stringify(row));

const recordNotFound = () =>
  new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });

const api = () => request(app);

describe(BASE, () => {
  it('POST / creates one', async () => {
    db.create.mockResolvedValue(row);

    const res = await api().post(BASE).send(createPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(json);
    expect(db.create).toHaveBeenCalledWith({ data: createPayload });
  });

  it('POST / rejects an invalid body', async () => {
    const res = await api().post(BASE).send({});

    expect(res.status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it('GET / lists them', async () => {
    db.findMany.mockResolvedValue([row]);

    const res = await api().get(BASE);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([json]);
  });

  it('GET /:id returns one', async () => {
    db.findUnique.mockResolvedValue(row);

    const res = await api().get(`${BASE}/${row.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(json);
    expect(db.findUnique).toHaveBeenCalledWith({ where: { id: row.id } });
  });

  it('GET /:id is 404 when it does not exist', async () => {
    db.findUnique.mockResolvedValue(null);

    const res = await api().get(`${BASE}/${row.id}`);

    expect(res.status).toBe(404);
  });

  it('PATCH /:id updates it', async () => {
    db.update.mockResolvedValue({ ...row, ...updatePayload });

    const res = await api().patch(`${BASE}/${row.id}`).send(updatePayload);

    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith({ where: { id: row.id }, data: updatePayload });
  });

  it('PATCH /:id is 404 when it does not exist', async () => {
    db.update.mockRejectedValue(recordNotFound());

    const res = await api().patch(`${BASE}/${row.id}`).send(updatePayload);

    expect(res.status).toBe(404);
  });

  it('DELETE /:id deletes it', async () => {
    db.delete.mockResolvedValue(row);

    const res = await api().delete(`${BASE}/${row.id}`);

    expect(res.status).toBe(200);
    expect(db.delete).toHaveBeenCalledWith({ where: { id: row.id } });
  });

  it('DELETE /:id is 404 when it does not exist', async () => {
    db.delete.mockRejectedValue(recordNotFound());

    const res = await api().delete(`${BASE}/${row.id}`);

    expect(res.status).toBe(404);
  });
});
