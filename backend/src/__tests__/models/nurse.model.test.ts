import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryResult } from '../testUtils';

vi.mock('../../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../../db/connection.js';
import { NurseModel } from '../../models/Nurse';

const queryMock = vi.mocked(query);
describe('NurseModel', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('retrieves collections and individual nurses', async () => {
    const nurseRow = { id: 'n1', name: 'Alice', role: 'staff' };

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [nurseRow] })); // findAll
    const all = await NurseModel.findAll();
    expect(all).toEqual([nurseRow]);
    expect(queryMock).toHaveBeenLastCalledWith(
      'SELECT * FROM nurses ORDER BY role DESC, name ASC'
    );

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [nurseRow] })); // findById
    const byId = await NurseModel.findById('n1');
    expect(byId).toEqual(nurseRow);
    expect(queryMock).toHaveBeenLastCalledWith(
      'SELECT * FROM nurses WHERE id = $1',
      ['n1']
    );

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [nurseRow] })); // findResponsible
    await NurseModel.findResponsible();
    expect(queryMock).toHaveBeenLastCalledWith(
      "SELECT * FROM nurses WHERE role = 'responsible' LIMIT 1"
    );

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [nurseRow] })); // findStaff
    await NurseModel.findStaff();
    expect(queryMock).toHaveBeenLastCalledWith(
      "SELECT * FROM nurses WHERE role = 'staff' ORDER BY name ASC"
    );
  });

  it('creates, updates, and deletes nurses', async () => {
    const created = { id: 'n2', name: 'Bob', role: 'staff' };
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [created] })); // create
    const result = await NurseModel.create({ name: 'Bob', role: 'staff' });
    expect(result).toEqual(created);
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO nurses'),
      ['Bob', 'staff']
    );

    const updated = { id: 'n2', name: 'Robert', role: 'staff' };
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [updated] })); // update
    const updateResult = await NurseModel.update('n2', { name: 'Robert' });
    expect(updateResult).toEqual(updated);
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE nurses'),
      ['Robert', 'n2']
    );

    queryMock.mockResolvedValueOnce(createQueryResult({ rowCount: 1 })); // delete
    const deleteResult = await NurseModel.delete('n2');
    expect(deleteResult).toBe(true);
    expect(queryMock).toHaveBeenLastCalledWith(
      'DELETE FROM nurses WHERE id = $1',
      ['n2']
    );
  });

  it('falls back to findById when update input is empty', async () => {
    const existing = { id: 'n3', name: 'Cara', role: 'staff' };
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [existing] })); // findById via update fallback
    const result = await NurseModel.update('n3', {});
    expect(result).toEqual(existing);
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenLastCalledWith(
      'SELECT * FROM nurses WHERE id = $1',
      ['n3']
    );
  });

  it('evaluates helper counters correctly', async () => {
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '1' }] })); // hasResponsible true
    const hasResp = await NurseModel.hasResponsible();
    expect(hasResp).toBe(true);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '0' }] })); // hasResponsible false
    const hasRespFalse = await NurseModel.hasResponsible();
    expect(hasRespFalse).toBe(false);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '3' }] })); // countStaff
    const staffCount = await NurseModel.countStaff();
    expect(staffCount).toBe(3);
  });

  it('handles missing data gracefully', async () => {
    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] }));
    expect(await NurseModel.findById('missing')).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] }));
    expect(await NurseModel.findResponsible()).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [] }));
    expect(await NurseModel.update('ghost', { name: 'Nope' })).toBeNull();

    queryMock.mockResolvedValueOnce(createQueryResult({ rowCount: 0 }));
    expect(await NurseModel.delete('ghost')).toBe(false);

    queryMock.mockResolvedValueOnce(createQueryResult({ rows: [{ count: '0' }] }));
    expect(await NurseModel.countStaff()).toBe(0);
  });
});
