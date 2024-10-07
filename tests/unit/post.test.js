//tests/unit/post.test.js

const request = require('supertest');
const app = require('../../src/app');
const logger = require('../../src/logger');

describe('POST /v1/fragments', () => {

  // if Authorization header is missing in request, it should be forbidden
  test('unauthenticated requests are denied', () =>
    request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('Hello, world!')
      .expect(401)
  );

  // If wrong username/password pair are used, it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'wrongpassword')
      .set('Content-Type', 'text/plain')
      .send('Hello, world!')
      .expect(401)
  );

  // authenticated users can create a plain text fragment
  test('authenticated users can create a plain text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a fragment');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBe(18); 
    expect(res.body.fragment.ownerId).toBeDefined();
    expect(res.body.fragment.created).toBeDefined();
    expect(res.body.fragment.updated).toBeDefined();
    expect(res.header['location']).toContain(`/v1/fragments/${res.body.fragment.id}`);
  });

    // Test to verify all expected properties in the response
    test('response includes all necessary and expected properties (id, created, type, size, ownerId)', async () => {
        const res = await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send('Fragment content to verify properties');
    
        expect(res.statusCode).toBe(201);
         // Check that response contains the necessary fragment properties
        const fragment = res.body.fragment;
        expect(fragment.id).toBeDefined();
        expect(fragment.ownerId).toBeDefined();
        expect(fragment.type).toBe('text/plain');
        expect(fragment.size).toBe(37);
        expect(fragment.created).toBeDefined();
        expect(fragment.updated).toBeDefined();
    });

   // POST response includes a Location header with a full URL to GET the created fragment
   test('response includes a Location header with a full URL to GET the created fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is another fragment');

    expect(res.statusCode).toBe(201);
    expect(res.header['location']).toBeDefined();

    // Construct expected URL based on the fragment ID and request details
    const expectedUrl = `${res.request.protocol}//${res.request.host}/v1/fragments/${res.body.fragment.id}`;
    expect(res.header['location']).toBe(expectedUrl);
  });

  // Unsupported content types should return 415 & log a warning
  test('unsupported content types are rejected and log a warning', async () => {
    const logSpy = jest.spyOn(logger, 'warn');

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/xml')
      .send('<message>Hello</message>');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(415);
    expect(res.body.error.message).toBe('Unsupported Media Type');
    expect(logSpy).toHaveBeenCalledWith('Request body is not a valid buffer');
  });



});
