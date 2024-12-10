//src/routes/api/post.js

const crypto = require('crypto');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

// Helper function to generate a UUID
function generateUUID() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = async (req, res) => {
  logger.debug('POST /fragments request received');

  // Validate that the content type is supported content type
  const contentType = req.headers['content-type'];
  if (!Fragment.isSupportedType(contentType)){
    logger.warn(`Unsupported content type: ${contentType}`);
    return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'));
  }

  // To ensure body is a valid Buffer
  if (!Buffer.isBuffer(req.body)) {
    logger.warn('Request body must be a binary buffer');
    return res.status(400).json(createErrorResponse(400, 'Request body must be a binary buffer'));
  }

  try{
    // Create a new fragment object
    const newFragment = new Fragment({
      id: generateUUID(),
      ownerId: req.user || null,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      type: req.headers['content-type'],
      size: Number(req.headers['content-length']),
    });

    logger.info(`Created fragment object with ID: ${newFragment.id}`);

    // Save fragment metadata and data
    await newFragment.save(); // Save fragment metadata
    await newFragment.setData(req.body); // Save fragment data
    logger.info(`Fragment with ID: ${newFragment.id} saved successfully`);

    // Construct location header for newly created fragment
    const api = process.env.API_URL || `http://${req.headers.host}`;
    const location = `${api}/v1/fragments/${newFragment.id}`;
    res.location(location);

    logger.debug(`Location header set to: ${location}`);
    logger.info(`Response for fragment ID: ${newFragment.id} sent with status 201`);

    // Respond with 201 Created and fragment metadata
    return res.status(201).json(createSuccessResponse({ fragment: newFragment }));
  } catch(error){
    logger.error(`Error saving fragment: ${error.message}`);
    return res.status(500).json(createErrorResponse(500, 'Internal Server Error'));
  }
};