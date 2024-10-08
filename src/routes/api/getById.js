// //src/routes/api/getById.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    // Attempt to retrieve the fragment by user and ID
    const fragment = await Fragment.byId(req.user, req.params.id);
    logger.info(`Fragment with ID ${req.params.id} retrieved successfully for user ${req.user}`);

    // Ensure it's a text fragment, as only text/plain is supported for now
    if (!fragment.isText) {
        logger.warn(`Fragment with ID ${req.params.id} is not a text fragment (type: ${fragment.type})`);
      return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'));
    }

    // Retrieve the fragment data
    const data = await fragment.getData();
    logger.debug(`Data for fragment ID ${req.params.id} retrieved successfully`);
    

    // Set the correct Content-Type header
    res.setHeader('Content-Type', fragment.type);

    // Respond with the fragment data wrapped inside createSuccessResponse
    return res.status(200).json(createSuccessResponse({ fragment, data: data.toString() }));
  } catch (error) {
    // If the error is related to fragment not being found, return 404
    if (error.message.includes('Fragment not found')) {
      logger.warn(`Fragment with ID ${req.params.id} not found for user ${req.user}`);
      return res.status(404).json(createErrorResponse(404, `Fragment with ID ${req.params.id} not found: ${error.message}`));
    }
    
    // For other errors (like data retrieval issues), return 500
    return res.status(500).json(createErrorResponse(500, `Failed to retrieve data: ${error.message}`));
  }
};