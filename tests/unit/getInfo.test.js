//tests/unit/getInfo.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

// Mock the Fragment model's byId method
jest.mock('../../src/model/fragment');

describe('GET /v1/fragments/:id/info', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123/info').expect(401));

  // If incorrect credentials are used, it should return 401 Unauthorized
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123/info').auth('invalid@email.com', 'wrongpassword').expect(401));

  // Authenticated users should receive the fragment metadata if it exists
  test('authenticated users can retrieve fragment metadata', async () => {
    const mockFragment = { id: '123', type: 'text/plain', size: 1024 };
    Fragment.byId.mockResolvedValue(mockFragment);

    const res = await request(app).get('/v1/fragments/123/info').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toEqual(mockFragment);
  });

  // Returns 404 if the fragment doesn't exist
  test('returns 404 if the fragment is not found', async () => {
    Fragment.byId.mockRejectedValue(new Error('Fragment not found'));

    const res = await request(app).get('/v1/fragments/123/info').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment not found');
  });

  // Returns 500 if an internal error occurs during metadata retrieval
  test('returns 500 if there is an internal error', async () => {
    Fragment.byId.mockRejectedValue(new Error('Database connection error'));

    const res = await request(app).get('/v1/fragments/123/info').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Failed to retrieve metadata');
  });
});
