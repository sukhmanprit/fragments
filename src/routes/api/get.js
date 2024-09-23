// src/routes/api/get.js

// Import response functions
const { createSuccessResponse, createErrorResponse } = require('../../response'); 

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  try {
    // TODO: this is just a placeholder. To get something working, return an empty array...
    const fragments = []; 

    // Send success response
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch{
    // Send error response
    res.status(500).json(createErrorResponse(500, 'Failed to retrieve fragments'));
  }
};