// src/routes/api/get.js

const { createSuccessResponse, createErrorResponse } = require('../../response'); 
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * Get a list of fragments for the current user
 */
module.exports = async (req, res) => {  // Mark the function as async to use await
  try {

    logger.debug('Received GET /fragments request with query parameters:', req.query);

    // Call the byUser method with the expand flag. Assuming expand is passed in the query.
    const expand = req.query.expand === 'true';  // Convert query param to a boolean
    const fragments = await Fragment.byUser(req.user, expand);

    logger.info(`Successfully retrieved ${fragments.length} fragments for user ${req.user}`);


    // Send success response
    res.status(200).json(createSuccessResponse({ fragments }));
  } catch (error) {
    logger.error(`Error retrieving fragments for user ${req.user}: ${error.message}`);
    // Send error response
    res.status(500).json(createErrorResponse(500, `Failed to retrieve fragments: ${error.message}`));
  }
};
