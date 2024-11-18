//src/routes/api/getInfo.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    // Get the fragment ID from the request parameters
    const fragmentId = req.params.id;

    // Attempt to find the fragment metadata for the user by ID
    const fragment = await Fragment.byId(req.user, fragmentId);

    // Log a success message if the fragment is found
    logger.info(`Metadata for fragment ID ${fragmentId} retrieved successfully for user ${req.user}`);

    // Return the fragment metadata in JSON format with a success response
    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    // If the fragment is not found, send a 404 Not Found response
    if (error.message.includes('Fragment not found')) {
      logger.warn(`Fragment with ID ${req.params.id} not found for user ${req.user}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // For any other error, send a 500 Internal Server Error response
    logger.error(`Failed to retrieve fragment metadata: ${error.message}`);
    return res.status(500).json(createErrorResponse(500, 'Failed to retrieve metadata'));
  }
};
