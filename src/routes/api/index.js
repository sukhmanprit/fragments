// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Support sending various Content-Types on the body up to 5M in size
const rawBody = () =>
    express.raw({
      inflate: true,
      limit: '5mb',
      type: (req) => {
        const { type } = contentType.parse(req);
        return Fragment.isSupportedType(type);
      },
    });
  
// POST /fragments (Post a fragment)
router.post('/fragments', rawBody(), require('./post'));

// GET /fragments (List all fragments for the authenticated user)
router.get('/fragments', require('./get'));

// GET /fragments/:id (Get a fragment by ID)
router.get('/fragments/:id', require('./getById'));

// GET /fragments/:id/info (Get a fragment info by ID)
router.get('/fragments/:id/info', require('./getInfo'));

// DELETE /fragments/:id (Delete a fragment by ID)
router.delete('/fragments/:id', require('./delete'));

// PUT /fragments/:id (Update a fragment by ID)
router.put('/fragments/:id', rawBody(), require('./put'));



module.exports = router;