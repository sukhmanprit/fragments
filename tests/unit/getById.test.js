//tests/unit/getById.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
//const logger = require('../../src/logger');
//const markdown = require('markdown-it')(); 

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

  // Returns html content if requested as html
  test('returns HTML content if Markdown fragment is requested as HTML', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      isText: true,
      mimeType: 'text/markdown',
      getData: jest.fn().mockResolvedValue(Buffer.from('# Markdown Content')),
    });

    const res = await request(app).get('/v1/fragments/123.html').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/html; charset=utf-8');
    expect(res.text).toContain('<h1>Markdown Content</h1>'); // Ensures Markdown was converted to HTML
  });

  // Verifies endpoint correctly retrieves and returns a text-based fragment with the expected  content-type
  test('returns fragment with correct Content-Type for non-HTML, non-Markdown content', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      isText: true,
      mimeType: 'text/plain',
      getData: jest.fn().mockResolvedValue(Buffer.from('Plain text content')),
    });

    const res = await request(app).get('/v1/fragments/123').auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain');
    expect(res.text).toBe('Plain text content');
  });

  //Test for Non-Text, Non-JSON Fragments
  test('returns 415 if the fragment is not a text type or application/json', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'image/png', 
      isText: false, 
      getData: jest.fn(), 
    });

    const res = await request(app)
      .get('/v1/fragments/123')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Unsupported Media Type');
  });

  //Test for Valid Text Fragment
  test('returns 200 for supported text fragments', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'text/plain', 
      isText: true, 
      getData: jest.fn().mockResolvedValue(Buffer.from('Plain text content')), 
    });

    const res = await request(app)
      .get('/v1/fragments/123')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain');
    expect(res.text).toBe('Plain text content');
  });

  //Test for Valid JSON Fragment
  test('returns 200 for application/json fragments', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'application/json', 
      isText: false, 
      getData: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify({ key: 'value' }))), 
    });

    const res = await request(app)
      .get('/v1/fragments/123')
      .auth('user1@email.com', 'password1');
    
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/json');
    expect(JSON.parse(res.text)).toEqual({ key: 'value' });
  });

});