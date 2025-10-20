import { describe, it, expect } from 'vitest';
import {
  mean,
  standardDeviation,
  calculateFairnessScore,
  normalizeScore,
} from '../../utils/fairnessCalculator';

describe('fairnessCalculator', () => {
  describe('mean', () => {
    it('should calculate the mean of an array of numbers', () => {
      expect(mean([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should return 0 for an empty array', () => {
      expect(mean([])).toBe(0);
    });
  });

  describe('standardDeviation', () => {
    it('should calculate the standard deviation', () => {
      // Example from https://www.scribbr.com/statistics/standard-deviation/
      const values = [1, 2, 2, 4, 6];
      expect(standardDeviation(values)).toBeCloseTo(1.788, 2);
    });

    it('should return 0 for an empty array', () => {
      expect(standardDeviation([])).toBe(0);
    });

    it('should return 0 if all values are the same', () => {
        expect(standardDeviation([5, 5, 5, 5])).toBe(0);
      });
  });

  describe('calculateFairnessScore', () => {
    it('should calculate a weighted fairness score', () => {
      const stats = { hoursStdDev: 5, nightsStdDev: 1, weekendsStdDev: 0.5 };
      const score = calculateFairnessScore(stats);
      // hoursScore = 100 - 5 * 2 = 90
      // nightsScore = 100 - 1 * 10 = 90
      // weekendsScore = 100 - 0.5 * 20 = 90
      // overall = 90 * 0.4 + 90 * 0.35 + 90 * 0.25 = 90
      expect(score.overall).toBe(90);
      expect(score.hoursScore).toBe(90);
      expect(score.nightsScore).toBe(90);
      expect(score.weekendsScore).toBe(90);
    });

    it('should handle zero standard deviation (perfect fairness)', () => {
        const stats = { hoursStdDev: 0, nightsStdDev: 0, weekendsStdDev: 0 };
        const score = calculateFairnessScore(stats);
        expect(score.overall).toBe(100);
      });
  });

  describe('normalizeScore', () => {
    it('should normalize a value to a 0-100 range', () => {
      expect(normalizeScore(50, 0, 100)).toBe(50);
      expect(normalizeScore(0, 0, 100)).toBe(0);
      expect(normalizeScore(100, 0, 100)).toBe(100);
      expect(normalizeScore(10, 0, 20)).toBe(50);
    });

    it('should return 100 if max equals min', () => {
        expect(normalizeScore(5, 5, 5)).toBe(100);
      });
  });
});
