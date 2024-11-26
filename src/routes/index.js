// src/routes/index.js

const express = require('express');
const { hostname } = require('os');

// Our authentication middleware
const { authenticate } = require('../auth');

// version and author from package.json
const { version, author } = require('../../package.json');

//import function to update HTTP Response from response.js
const { createSuccessResponse } = require('../response'); 


// Create a router that we can use to mount our API
const router = express.Router();

/**
 * Expose all of our API routes on /v1/* to include an API version.
 */
router.use(`/v1`, authenticate(),require('./api'));

/**
 * Define a simple health check route. If the server is running
 * we'll respond with a 200 OK.  If not, the server isn't healthy.
 */
// router.get('/', (req, res) => {
//   // Client's shouldn't cache this response (always request it fresh)
//   res.setHeader('Cache-Control', 'no-cache');
//   // Using createSuccessResponse instead of res.status(200).json()
//   const response = createSuccessResponse({
//     author,
//     // Use your own GitHub URL for this!
//     githubUrl: 'https://github.com/sukhmanprit/fragments',
//     version,
//   });
//   res.status(200).json(response);
// });

router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      author,
      githubUrl: 'https://github.com/sukhmanprit/fragments',
      version,
      // Include the hostname in the response
      hostname: hostname(),
    })
  );
});

module.exports = router;
