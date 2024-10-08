//tests/unit/getById.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

// Mock the Fragment model's byId method
jest.mock('../../src/model/fragment');

describe('GET /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/123').expect(401));

  // If incorrect credentials are used, it should return 401 Unauthorized
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments/123').auth('invalid@email.com', 'wrongpassword').expect(401));

  // Returns 404 if the fragment doesn't exist
  test('returns 404 if the fragment is not found', async () => {
    Fragment.byId.mockRejectedValue(new Error('Fragment not found'));

    const res = await request(app).get('/v1/fragments/123').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Fragment with ID 123 not found: Fragment not found');
  });

  // Returns 415 if the fragment is not of type text/plain
  test('returns 415 if the fragment is not a text fragment', async () => {
    Fragment.byId.mockResolvedValue({ id: '123', type: 'image/png', isText: false });

    const res = await request(app).get('/v1/fragments/123').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Unsupported Media Type');
  });

  // If retrieving data fails, it should return 500
  test('returns 500 if retrieving data fails', async () => {
    Fragment.byId.mockResolvedValue({ id: '123', type: 'text/plain', isText: true, getData: jest.fn().mockRejectedValue(new Error('Data retrieval failed')) });

    const res = await request(app).get('/v1/fragments/123').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Failed to retrieve data: Data retrieval failed');
  });

  
});
