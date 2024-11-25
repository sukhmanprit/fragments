// tests/unit/delete.test.js

const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');
const { Fragment } = require('../../src/model/fragment');

describe('DELETE /v1/fragments/:id', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/some-id').expect(401)
  );

  // If incorrect credentials are used, it should return 401 Unauthorized
  test('incorrect credentials are denied', () =>
    request(app).delete('/v1/fragments/123').auth('invalid@email.com', 'wrongpassword').expect(401)
  );

  // Test attempting to delete a fragment that does not exist returns 404
  test('attempting to delete a nonexistent fragment returns 404', async () => {
    const logSpy = jest.spyOn(logger, 'warn');

    const res = await request(app).delete('/v1/fragments/123').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Fragment with ID 123 not found for user'));
  });

  // Test successfully deleting a fragment
  test('authenticated users can delete an existing fragment', async () => {
    // Mock a fragment for the test
    const mockFragment = {
      id: '123',
      ownerId: 'user1@email.com',
      type: 'text/plain',
      size: 18,
    };

    // Mock the `Fragment.byId` and `Fragment.delete` methods
    jest.spyOn(Fragment, 'byId').mockResolvedValue(mockFragment);
    jest.spyOn(Fragment, 'delete').mockResolvedValue();

    const res = await request(app).delete(`/v1/fragments/${mockFragment.id}`).auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // Test when the fragment exists but no longer matches with the user's ownership
  test('attempting to delete another user’s fragment returns 404', async () => {
    jest.spyOn(Fragment, 'byId').mockResolvedValue(null); 
    const res = await request(app).delete('/v1/fragments/123').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(404);
    expect(res.body.error.message).toBe('Fragment not found');
  });
  
});
