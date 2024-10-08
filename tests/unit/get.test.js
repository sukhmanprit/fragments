// tests/unit/get.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

// Mock the Fragment model's byUser method
jest.mock('../../src/model/fragment');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments').expect(401));

  // If incorrect credentials are used, it should return 401 Unauthorized
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'wrongpassword').expect(401));

  // Authenticated users should receive a list of fragments
  test('authenticated users get a list of fragments', async () => {
    // Mocking the byUser method to return some fragments
    Fragment.byUser.mockResolvedValue([{ id: '123', type: 'text/plain' }]);

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).toBe(1);
    expect(res.body.fragments[0].id).toBe('123');
  });

  // Expand flag should work and return full fragments
  test('authenticated users can request expanded fragments', async () => {
    Fragment.byUser.mockResolvedValue([{ id: '123', type: 'text/plain', data: 'Fragment data' }]);

    const res = await request(app).get('/v1/fragments?expand=true').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments[0].data).toBe('Fragment data');
  });

  // When there are no fragments, it should return an empty array
  test('returns an empty array when no fragments are found', async () => {
    Fragment.byUser.mockResolvedValue([]);

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
    expect(res.body.fragments.length).toBe(0);
  });

  // If the byUser method throws an error, it should return 500
  test('returns 500 if retrieving fragments fails', async () => {
    Fragment.byUser.mockRejectedValue(new Error('Something went wrong'));

    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Failed to retrieve fragments: Something went wrong');
  });
});
