// src/routes/api/delete.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {

 // Get the requested fragment ID
  const fragmentIdWithExt = req.params.id;
  const [fragmentId] = fragmentIdWithExt.split('.');
  logger.debug(`DELETE request received for fragment ID: ${fragmentId} by user: ${req.user}`);

  try {
    // Ensure the user is authenticated
    if (!req.user) {
      logger.warn('Unauthorized request: no user information found');
      return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
    }

    // Attempt to find the fragment by user and ID
    const fragment = await Fragment.byId(req.user, fragmentId);
    if (!fragment) {
      logger.warn(`Fragment with ID ${fragmentId} not found for user ${req.user}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Delete the fragment
    await Fragment.delete(req.user, fragmentId);
    logger.info(`Fragment with ID ${fragmentId} successfully deleted`);

    // Respond with success
    return res.status(200).json(createSuccessResponse({ status: 'ok' }));
  } catch (error) {
    // If the error is related to fragment not being found, return 404
    if (error.message.includes('Fragment not found')) {
      logger.warn(`Fragment with ID ${fragmentId} not found for user ${req.user}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // For other errors (like data retrieval issues), return 500
    return res.status(500).json(createErrorResponse(500, `Failed to retrieve data: ${error.message}`));
  }
};
