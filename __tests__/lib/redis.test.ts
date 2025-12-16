/**
 * @jest-environment node
 */

import redis from '../../lib/redis';

// Mock ioredis
jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => {
        return {
            get: jest.fn(),
            set: jest.fn(),
        };
    });
});

describe('Redis Client', () => {
    it('should be defined', () => {
        expect(redis).toBeDefined();
    });

    // Simple test to ensure the singleton pattern works as expected
    // Note: Since we are in a test environment (Node based), redis should be initialized
    it('should initialize redis instance', () => {
        expect(redis).toBeTruthy();
    });
});
