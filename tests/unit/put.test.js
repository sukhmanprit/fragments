const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');

// Mock the Fragment model's methods
jest.mock('../../src/model/fragment');

describe('PUT /v1/fragments/:id', () => {
  const userEmail = 'user1@email.com';
  const password = 'password1';
  const fragmentId = '123';
  const contentType = 'text/plain';
  const fragmentData = Buffer.from('Updated fragment content');

  // if Authorization header is missing in request, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .set('Content-Type', contentType)
      .send(fragmentData)
      .expect(401)
  );

  // If wrong username/password pair are used, it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('invalid@email.com', 'wrongpassword')
      .set('Content-Type', contentType)
      .send(fragmentData)
      .expect(401)
  );
  
  // Returns 404 if the fragment is not found
  test('returns 404 if the fragment is not found', async () => {
    Fragment.byId.mockResolvedValueOnce(null);

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(userEmail, password)
      .set('Content-Type', contentType)
      .send(fragmentData);

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain(`Fragment with ID ${fragmentId} not found`);
  });
  

  // Returns 400 if Content-Type mismatch occurs
  test('returns 400 if Content-Type mismatch occurs', async () => {
    Fragment.byId.mockResolvedValueOnce({ id: fragmentId, type: contentType });

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(userEmail, password)
      .set('Content-Type', 'application/json') // Mismatched Content-Type
      .send(JSON.stringify({ data: 'Invalid type update' }));

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain(
      `Content-Type mismatch. Expected: ${contentType}, Received: application/json`
    );
  });

  // Returns 400 if the request body is not a binary buffer
  test('returns 400 if request body is not a binary buffer', async () => {
    Fragment.byId.mockResolvedValueOnce({ id: fragmentId, type: contentType });

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(userEmail, password)
      .set('Content-Type', contentType)
      .send('Non-buffer content'); // Non binary buffer

    expect(res.statusCode).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Request body must be a binary buffer');
  });
  
  // Returns 500 if an internal server error occurs
  test('returns 500 if an internal server error occurs', async () => {
    Fragment.byId.mockRejectedValueOnce(new Error('Internal error'));

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth(userEmail, password)
      .set('Content-Type', contentType)
      .send(fragmentData);

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Internal Server Error');
  });
  
});
