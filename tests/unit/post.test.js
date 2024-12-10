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

  // Authenticated users can create a text/html fragment
  test('authenticated users can create a text/html fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('<p>This is an HTML fragment</p>');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/html');
    expect(res.body.fragment.size).toBe(31);
    expect(res.body.fragment.ownerId).toBeDefined();
    expect(res.body.fragment.created).toBeDefined();
    expect(res.body.fragment.updated).toBeDefined();
    expect(res.header['location']).toContain(`/v1/fragments/${res.body.fragment.id}`);
  });

  // Authenticated users can create a text/markdown fragment
  test('authenticated users can create a text/markdown fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Markdown Title\n\nThis is a markdown fragment');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/markdown');
    expect(res.body.fragment.size).toBe(45);
    expect(res.body.fragment.ownerId).toBeDefined();
    expect(res.body.fragment.created).toBeDefined();
    expect(res.body.fragment.updated).toBeDefined();
    expect(res.header['location']).toContain(`/v1/fragments/${res.body.fragment.id}`);
  });

  // Authenticated users can create a JSON fragment
  test('authenticated users can create an application/json fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ message: 'Hello, JSON fragment' }));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('application/json');
    expect(res.body.fragment.size).toBeGreaterThan(0); 
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
    // Update expected log message to match actual log output
  expect(logSpy).toHaveBeenCalledWith('Unsupported content type: application/xml');
  });
  
  

  // Error saving fragment
  test('error during fragment saving is handled correctly', async () => {
    // Mock the `Fragment` model to throw an error
    jest.spyOn(require('../../src/model/fragment').Fragment.prototype, 'save').mockImplementationOnce(() => {
      throw new Error('Database save failed');
    });

    const logSpy = jest.spyOn(logger, 'error');

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This will cause an error');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.code).toBe(500);
    expect(res.body.error.message).toBe('Internal Server Error');

    // Check that the log error was called with the correct message
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Error saving fragment: Database save failed'));
  });

});