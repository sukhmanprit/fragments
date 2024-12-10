//src/routes/api/put.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug(`PUT /fragments/${req.params.id} request received`);

  const contentType = req.headers['content-type'];
  const fragmentId = req.params.id;
  const user = req.user;
  const data = req.body;

  // Validate the Content-Type
  if (!contentType) {
    logger.warn('Content-Type header missing');
    return res.status(400).json(createErrorResponse(400, 'Content-Type header is required'));
  }

  try {
    // Fetch fragment
    const fragment = await Fragment.byId(user, fragmentId);

    if (!fragment) {
      logger.warn(`Fragment with ID ${fragmentId} not found for user ${user}`);
      return res.status(404).json(createErrorResponse(404, `Fragment with ID ${fragmentId} not found`));
    }

    logger.info(`Fragment with ID ${fragmentId} found for user ${user}`);

    // Validate if Content-Type matches with the fragment's type
    if (fragment.type !== contentType) {
      logger.warn(`Content-Type mismatch for the fragment ID ${fragmentId}. Expected: ${fragment.type}, Received: ${contentType}`);
      return res.status(400).json(createErrorResponse(400, `Content-Type mismatch. Expected: ${fragment.type}, Received: ${contentType}`));
    }

    // Validate if the request body is binary buffer
    if (!Buffer.isBuffer(data)) {
      logger.warn('Request body must be a binary buffer');
      return res.status(400).json(createErrorResponse(400, 'Request body must be a binary buffer'));
    }

    // Update fragment data and metadata
    fragment.updated = new Date().toISOString();
    await fragment.setData(data);
    await fragment.save();

    logger.info(`Fragment with ID ${fragmentId} updated successfully`);

    // Respond with updated fragment metadata
    return res.status(200).json(createSuccessResponse({ fragment }));
  } catch (error) {
    logger.error(`Error updating fragment: ${error.message}`);
    return res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};
