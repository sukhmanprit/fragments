//src/routes/api/getById.js

const {createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const markdown= require('markdown-it')(); 

module.exports = async (req, res) => {
  try {

    // Get the requested fragment ID and file extension; html for conversions
    const fragmentIdWithExt = req.params.id;
    const [fragmentId, requestedExt] = fragmentIdWithExt.split('.'); // Split by '.' to separate ID & extension
    logger.debug(`Requested fragment ID: ${fragmentId}, Requested extension: ${requestedExt}`);


    // Attempt to retrieve the fragment by user and ID
    const fragment = await Fragment.byId(req.user, fragmentId);
    logger.info(`Fragment with ID ${fragmentId} retrieved successfully for user ${req.user}`);

    // Ensure it's a text fragment, as only text/plain is supported for now
    if (!fragment.isText && fragment.mimeType != 'application/json') {
        logger.warn(`Fragment with ID ${req.params.id} is not a supported fragment (type: ${fragment.type})`);
      return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'));
    }


    // Check if the user requested an HTML version of a Markdown fragment
    if (requestedExt === 'html' && fragment.mimeType === 'text/markdown') {
      // Convert Markdown content to HTML using markdown-it
      const markdownData = await fragment.getData();
      logger.debug(`Converting Markdown to HTML for fragment ID: ${fragmentId}`);
      const htmlData = markdown.render(markdownData.toString()); 

      // Set the Content-Type header to 'text/html' and respond with the HTML data
      res.setHeader('Content-Type', 'text/html');
      logger.debug(`Sending converted HTML data for fragment ID: ${fragmentId}`);
      return res.status(200).send(htmlData);
    }

    // Set the correct Content-Type header
    res.setHeader('Content-Type', fragment.mimeType);

    // Retrieve the raw fragment data and send as response
    const data = await fragment.getData();
    logger.debug(`Returning raw data for fragment ID: ${fragmentId} with Content-Type: ${fragment.mimeType}`);
    return res.status(200).send(data);
  
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