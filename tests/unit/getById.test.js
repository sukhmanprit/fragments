//tests/unit/getById.test.js

const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const sharp = require('sharp');

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


  // Returns raw data if the requested extension matches original type
  test('returns raw data when requested extension matches original type', async () => {
    const rawContent = 'This is plain text content.';
    const rawBuffer = Buffer.from(rawContent);

    Fragment.byId.mockResolvedValue({
      id: '456',
      mimeType: 'text/plain',
      getData: jest.fn().mockResolvedValue(rawBuffer),
    });

    const res = await request(app).get('/v1/fragments/456.txt').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain');
    expect(res.text).toBe(rawContent); // Ensure the returned content matches the raw data
  });

  // Returns 415 for unsupported extensions
  test('returns 415 for unsupported extensions', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'text/plain',
      getData: jest.fn().mockResolvedValue(Buffer.from('Some data')),
    });

    const res = await request(app).get('/v1/fragments/123.unsupported').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Unsupported extension');
  });

  // Returns 415 for non-supported conversions
  test('returns 415 if conversion is not supported', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'text/plain',
      getData: jest.fn().mockResolvedValue(Buffer.from('Some data')),
    });

    const res = await request(app).get('/v1/fragments/123.json').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Conversion to json is not supported');
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


  // Returns json from csv 
  test('returns converted CSV to JSON', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'text/csv',
      getData: jest.fn().mockResolvedValue(Buffer.from('name,age\nJohn,30\nDoe,25')),
    });

    const res = await request(app).get('/v1/fragments/123.json').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(JSON.parse(res.text)).toEqual([
      { name: 'John', age: '30' },
      { name: 'Doe', age: '25' },
    ]);
  });

  //Returns converted Json to Yaml
  test('returns converted JSON to YAML', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'application/json',
      getData: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify({ name: 'John', age: 30 }))),
    });

    const res = await request(app).get('/v1/fragments/123.yaml').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/yaml; charset=utf-8');
    expect(res.text).toContain('name: John');
    expect(res.text).toContain('age: 30');
  });

  //test cases for image conversions
  test('converts images between formats', async () => {
    const imageBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'image/png',
      getData: jest.fn().mockResolvedValue(imageBuffer),
    });

    const res = await request(app).get('/v1/fragments/123.webp').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/webp');
    expect(res.body).toBeDefined();
  });

  //returns 404 - fragment no found
  test('returns 404 if fragment is not found', async () => {
    Fragment.byId.mockResolvedValue(null);

    const res = await request(app).get('/v1/fragments/123').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Fragment with ID 123 not found');
  });

  // Returns Markdown to Plain Text Conversion
  test('converts markdown to plain text', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'text/markdown',
      getData: jest.fn().mockResolvedValue(Buffer.from('# Markdown Content')),
    });

    const res = await request(app).get('/v1/fragments/123.txt').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(res.text).toBe('Markdown Content\n'); // Plain text conversion of Markdown
  });

  // Returns YAML to Plain Text conversion
  test('converts YAML to plain text', async () => {
    const yamlContent = `
    name: John
    age: 30
    city: New York
    `;
    const yamlBuffer = Buffer.from(yamlContent);

    Fragment.byId.mockResolvedValue({
      id: '130',
      mimeType: 'application/yaml',
      getData: jest.fn().mockResolvedValue(yamlBuffer),
    });

    const res = await request(app).get('/v1/fragments/130.txt').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(res.text).toContain('name: John');
    expect(res.text).toContain('age: 30');
    expect(res.text).toContain('city: New York');
  });

  // Returns HTML to Plain Text Conversion
  test('converts HTML to plain text', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'text/html',
      getData: jest.fn().mockResolvedValue(Buffer.from('<p>HTML Content</p>')),
    });

    const res = await request(app).get('/v1/fragments/123.txt').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(res.text).toBe('HTML Content'); // Plain text conversion of HTML
  });

  // Returns JSON to YAML Conversion
  test('converts JSON to YAML', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'application/json',
      getData: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify({ name: 'John', age: 30 }))),
    });

    const res = await request(app).get('/v1/fragments/123.yaml').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/yaml; charset=utf-8');
    expect(res.text).toContain('name: John');
    expect(res.text).toContain('age: 30');
  });

  // Returns JSON to Plain Text Conversion
  test('converts JSON to plain text', async () => {
    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'application/json',
      getData: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify({ name: 'John', age: 30 }))),
    });

    const res = await request(app).get('/v1/fragments/123.txt').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('text/plain; charset=utf-8');
    expect(res.text).toContain('"name": "John"');
    expect(res.text).toContain('"age": 30');
  });


  // Returns PNG to JPEG Image Conversion
  test('converts PNG to JPEG', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    Fragment.byId.mockResolvedValue({
      id: '123',
      mimeType: 'image/png',
      getData: jest.fn().mockResolvedValue(pngBuffer),
    });

    const res = await request(app).get('/v1/fragments/123.jpg').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/jpeg');
    expect(res.body).toBeDefined();
  });

  // Returns JPEG to PNG Image Conversion
  test('converts JPEG to PNG', async () => {
    const jpegBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    Fragment.byId.mockResolvedValue({
      id: '124',
      mimeType: 'image/jpeg',
      getData: jest.fn().mockResolvedValue(jpegBuffer),
    });

    const res = await request(app).get('/v1/fragments/124.png').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.body).toBeDefined();
  });

  // Returns JPEG to WEBP Image Conversion
  test('converts JPEG to WEBP', async () => {
    const jpegBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();

    Fragment.byId.mockResolvedValue({
      id: '125',
      mimeType: 'image/jpeg',
      getData: jest.fn().mockResolvedValue(jpegBuffer),
    });

    const res = await request(app).get('/v1/fragments/125.webp').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/webp');
    expect(res.body).toBeDefined();
  });

  // Returns PNG to GIF Image Conversion
  test('converts PNG to GIF', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 0 },
      },
    })
      .png()
      .toBuffer();

    Fragment.byId.mockResolvedValue({
      id: '126',
      mimeType: 'image/png',
      getData: jest.fn().mockResolvedValue(pngBuffer),
    });

    const res = await request(app).get('/v1/fragments/126.gif').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/gif');
    expect(res.body).toBeDefined();
  });

  // Returns AVIF to PNG Image Conversion
  test('converts AVIF to PNG', async () => {
    const avifBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .avif()
      .toBuffer();

    Fragment.byId.mockResolvedValue({
      id: '127',
      mimeType: 'image/avif',
      getData: jest.fn().mockResolvedValue(avifBuffer),
    });

    const res = await request(app).get('/v1/fragments/127.png').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.body).toBeDefined();
  });

  //  Returns AVIF to AVIF Conversion
  test('converts AVIF to AVIF', async () => {
    const avifBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .avif()
      .toBuffer();

    Fragment.byId.mockResolvedValue({
      id: '128',
      mimeType: 'image/avif',
      getData: jest.fn().mockResolvedValue(avifBuffer),
    });

    const res = await request(app).get('/v1/fragments/128.avif').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('image/avif');
    expect(res.body).toEqual(avifBuffer);
  });

  // Unsupported Format Conversion for image conversion
  test('returns 415 for unsupported format conversion', async () => {
    const unsupportedBuffer = await sharp({
      create: {
        width: 10,
        height: 10,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    Fragment.byId.mockResolvedValue({
      id: '129',
      mimeType: 'image/png',
      getData: jest.fn().mockResolvedValue(unsupportedBuffer),
    });

    const res = await request(app).get('/v1/fragments/129.xyz').auth('user1@email.com', 'password1'); // Unsupported extension `.xyz`

    expect(res.statusCode).toBe(415);
    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Unsupported extension');
  });

  //Returns 500 - Internal server error
  test('returns 500 if there is an internal server error', async () => {
    Fragment.byId.mockRejectedValue(new Error('Internal server error'));

    const res = await request(app).get('/v1/fragments/123').auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toContain('Failed to retrieve data');
  });

});