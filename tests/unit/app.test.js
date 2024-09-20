// tests/unit/app.test.js

const request = require('supertest');
const app = require('../../src/app'); 

describe('404 Error Handler', () => {
    // Returns a 404 status code by accessing unknown route
    it('return a 404 - not found status', async () => {
        const response = await request(app).get('/unknown-route'); // Triggers 404
        //// Expect the result to look like the following
        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            status: 'error',
            error: {
                message: 'not found',
                code: 404,
            },
        });
    });
});
