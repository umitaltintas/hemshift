import request from 'supertest';
import { describe, it, expect, vi } from 'vitest';
import app from '../../server';
import { NurseModel } from '../../models/Nurse';

// Mock the NurseModel
vi.mock('../../models/Nurse');

describe('Nurses API', () => {
  it('GET /api/nurses should return a list of nurses', async () => {
    // Arrange
    const mockNurses = [
      { id: 1, name: 'Nurse Joy', is_active: true },
      { id: 2, name: 'Nurse Ann', is_active: true },
    ];
    // Tell the mock what to return
    (NurseModel.findAll as vi.Mock).mockResolvedValue(mockNurses);

    // Act
    const response = await request(app).get('/api/nurses');

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(mockNurses);
    expect(NurseModel.findAll).toHaveBeenCalledOnce();
  });

  describe('POST /api/nurses', () => {
    it('should return a 409 conflict when trying to create a second responsible nurse', async () => {
      // Arrange
      (NurseModel.hasResponsible as vi.Mock).mockResolvedValue(true);
      const newResponsibleNurse = { name: 'Nurse Ratched', role: 'responsible' };

      // Act
      const response = await request(app).post('/api/nurses').send(newResponsibleNurse);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.error.message).toBe('Sistemde zaten bir sorumlu hemşire var');
    });
  });
});
