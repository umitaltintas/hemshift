import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../../server';
import { NurseModel } from '../../models/Nurse';

vi.mock('../../models/Nurse');

const mockedNurseModel = vi.mocked(NurseModel);
const nurseId = '123e4567-e89b-12d3-a456-426614174000';

describe('Nurses API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('GET /api/nurses returns all nurses', async () => {
    const nurses = [{ id: nurseId, name: 'Alice', role: 'staff' }];
    mockedNurseModel.findAll.mockResolvedValue(nurses);

    const res = await request(app).get('/api/nurses');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(nurses);
    expect(mockedNurseModel.findAll).toHaveBeenCalledOnce();
  });

  it('GET /api/nurses/responsible returns 404 when absent', async () => {
    mockedNurseModel.findResponsible.mockResolvedValue(null);

    const res = await request(app).get('/api/nurses/responsible');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Sorumlu hemşire bulunamadı');
  });

  it('GET /api/nurses/responsible returns the responsible nurse', async () => {
    const responsible = { id: nurseId, name: 'Rita', role: 'responsible' };
    mockedNurseModel.findResponsible.mockResolvedValue(responsible);

    const res = await request(app).get('/api/nurses/responsible');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(responsible);
  });

  it('GET /api/nurses/staff returns staff list', async () => {
    const staff = [
      { id: 'staff-1', name: 'Bob', role: 'staff' },
      { id: 'staff-2', name: 'Cara', role: 'staff' },
    ];
    mockedNurseModel.findStaff.mockResolvedValue(staff);

    const res = await request(app).get('/api/nurses/staff');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(staff);
  });

  it('GET /api/nurses/:id returns 404 when nurse missing', async () => {
    mockedNurseModel.findById.mockResolvedValue(null);

    const res = await request(app).get(`/api/nurses/${nurseId}`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Hemşire bulunamadı');
  });

  it('GET /api/nurses/:id returns the nurse when present', async () => {
    const nurse = { id: nurseId, name: 'Alice', role: 'staff' };
    mockedNurseModel.findById.mockResolvedValue(nurse);

    const res = await request(app).get(`/api/nurses/${nurseId}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(nurse);
  });

  it('POST /api/nurses prevents duplicate responsible nurse', async () => {
    mockedNurseModel.hasResponsible.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/nurses')
      .send({ name: 'Rita', role: 'responsible' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Sistemde zaten bir sorumlu hemşire var');
    expect(mockedNurseModel.create).not.toHaveBeenCalled();
  });

  it('POST /api/nurses creates staff nurse', async () => {
    mockedNurseModel.hasResponsible.mockResolvedValue(false);
    const created = { id: nurseId, name: 'Bob', role: 'staff' };
    mockedNurseModel.create.mockResolvedValue(created);

    const res = await request(app)
      .post('/api/nurses')
      .send({ name: 'Bob', role: 'staff' });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(created);
    expect(mockedNurseModel.create).toHaveBeenCalledWith({ name: 'Bob', role: 'staff' });
  });

  it('POST /api/nurses creates first responsible nurse', async () => {
    const created = { id: nurseId, name: 'Rita', role: 'responsible' };
    mockedNurseModel.hasResponsible.mockResolvedValue(false);
    mockedNurseModel.create.mockResolvedValue(created);

    const res = await request(app)
      .post('/api/nurses')
      .send({ name: 'Rita', role: 'responsible' });

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(created);
    expect(mockedNurseModel.hasResponsible).toHaveBeenCalled();
  });

  it('PUT /api/nurses/:id returns 404 when nurse missing', async () => {
    mockedNurseModel.findById.mockResolvedValue(null);

    const res = await request(app)
      .put(`/api/nurses/${nurseId}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Hemşire bulunamadı');
  });

  it('PUT /api/nurses/:id updates nurse', async () => {
    const original = { id: nurseId, name: 'Alice', role: 'staff' };
    const updated = { id: nurseId, name: 'Updated', role: 'staff' };
    mockedNurseModel.findById.mockResolvedValue(original);
    mockedNurseModel.update.mockResolvedValue(updated);

    const res = await request(app)
      .put(`/api/nurses/${nurseId}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(updated);
    expect(mockedNurseModel.update).toHaveBeenCalledWith(nurseId, { name: 'Updated' });
  });

  it('DELETE /api/nurses/:id forbids removing responsible nurse', async () => {
    mockedNurseModel.findById.mockResolvedValue({ id: nurseId, name: 'Rita', role: 'responsible' });

    const res = await request(app).delete(`/api/nurses/${nurseId}`);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Sorumlu hemşire silinemez');
    expect(mockedNurseModel.delete).not.toHaveBeenCalled();
  });

  it('DELETE /api/nurses/:id deletes staff nurse', async () => {
    mockedNurseModel.findById.mockResolvedValue({ id: nurseId, name: 'Bob', role: 'staff' });
    mockedNurseModel.delete.mockResolvedValue(true);

    const res = await request(app).delete(`/api/nurses/${nurseId}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Hemşire başarıyla silindi');
    expect(mockedNurseModel.delete).toHaveBeenCalledWith(nurseId);
  });

  it('DELETE /api/nurses/:id returns 404 when delete fails', async () => {
    mockedNurseModel.findById.mockResolvedValue({ id: nurseId, name: 'Bob', role: 'staff' });
    mockedNurseModel.delete.mockResolvedValue(false);

    const res = await request(app).delete(`/api/nurses/${nurseId}`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Hemşire bulunamadı');
  });

  it('handles unexpected errors with 500 response', async () => {
    mockedNurseModel.findAll.mockRejectedValue(new Error('db down'));

    const res = await request(app).get('/api/nurses');

    expect(res.status).toBe(500);
    expect(res.body.error.message).toBe('db down');
    expect(res.body.success).toBe(false);
  });
});
