//src/routes/api/getById.js

const {createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');
const markdown= require('markdown-it')(); 
const sharp = require('sharp'); // FOR IMG conversions
const yaml = require('js-yaml'); // For JSON-YAML conversions


module.exports = async (req, res) => {
  try {

    // Get the requested fragment ID and file extension
    const fragmentIdWithExt = req.params.id;
    const [fragmentId, requestedExt] = fragmentIdWithExt.split('.'); // Split by '.' to separate ID & extension
    logger.debug(`Requested fragment ID: ${fragmentId}, Requested extension: ${requestedExt}`);


    // Attempt to retrieve the fragment by user and ID
    const fragment = await Fragment.byId(req.user, fragmentId);
    if (!fragment) {
      logger.warn(`Fragment with ID ${fragmentId} not found for user ${req.user}`);
      return res.status(404).json(createErrorResponse(404, `Fragment with ID ${fragmentId} not found`));
    }
    logger.info(`Fragment with ID ${fragmentId} retrieved successfully for user ${req.user}`);


    // Retrieve the raw fragment data
    const data = await fragment.getData();
    const originalType = fragment.mimeType;

    // If no extension is provided, return raw fragment data
    if (!requestedExt) {
      res.setHeader('Content-Type', originalType);
      res.setHeader('Content-Length', fragment.size);
      logger.info(`Returning raw data for fragment ID: ${fragmentId}`);
      return res.status(200).send(data);
    }

    // Mapping extensions to mime types
    const mimeTypeMap = {
      txt: 'text/plain',
      md: 'text/markdown',
      html: 'text/html',
      csv: 'text/csv',
      json: 'application/json',
      yaml: 'application/yaml',
      yml: 'application/yaml',
      jpg: 'image/jpeg',
      png: 'image/png',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
    };

    // Determine the requested MIME type
    const targetType = mimeTypeMap[requestedExt];
    if (!targetType) {
      logger.warn(`Unsupported extension requested: ${requestedExt}`);
      return res.status(415).json(createErrorResponse(415, `Unsupported extension: ${requestedExt}`));
    }

    // Perform conversion if supported
    const convertedData = await convertFrag(fragment, data, targetType, requestedExt);
    if (!convertedData) {
      logger.warn(`Conversion from ${originalType} to ${targetType} not supported`);
      return res.status(415).json(createErrorResponse(415, `Conversion to ${requestedExt} is not supported`));
    }

    // Return the converted data
    res.setHeader('Content-Type', targetType);
    res.setHeader('Content-Length', convertedData.length);
    logger.info(`Returning converted data for fragment ID: ${fragmentId} to type: ${targetType}`);
    return res.status(200).send(convertedData);
  
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


// Helper function to handle fragment conversion
const convertFrag = async (fragment, data, targetType, requestedExt) => {
  const originalType = fragment.mimeType;

  // Return raw data if the requested extension matches original type
  if (targetType === originalType) {
    return data;
  }

  // Markdown to HTML or Plain Text
  if (originalType === 'text/markdown') {
    if (targetType === 'text/html') return markdown.render(data.toString('utf8'));
    if (targetType === 'text/plain') return markdown.render(data.toString('utf8')).replace(/<[^>]*>/g, '');
  }

  // HTML to Plain Text
  if (originalType === 'text/html' && targetType === 'text/plain') {
    return data.toString('utf8').replace(/<[^>]*>/g, '');
  }

  // CSV to JSON or Plain Text
  if (originalType === 'text/csv') {
    const csv = data.toString('utf8');
    // Parse CSV rows
    const rows = csv.split('\n').map((row) => row.split(',')); 
    if (targetType === 'application/json') {
      const headers = rows[0];
      const json = rows.slice(1).map((row) =>
        row.reduce((obj, value, index) => ({ ...obj, [headers[index]]: value }), {})
      );
      return JSON.stringify(json, null, 2);
    }
    if (targetType === 'text/plain') return csv;
  }

  // JSON to  YAML or Plain Text
  if (originalType === 'application/json') {
    const parsedJSON = JSON.parse(data.toString('utf8'));

    if (targetType === 'application/yaml') {
      return yaml.dump(parsedJSON);
    }

    if (targetType === 'text/plain') {
      return JSON.stringify(parsedJSON, null, 2);
    }
  }

  // YAML to Plain Text
  if (originalType === 'application/yaml' && targetType === 'text/plain') {
    return yaml.dump(yaml.load(data.toString('utf8'))); 
  }
  
  // Image format conversions using sharp
  if (originalType.startsWith('image/') && targetType.startsWith('image/')) {
    const sharpInstance = sharp(data);
    switch (requestedExt) {
      case 'png':
        return sharpInstance.png().toBuffer();
      case 'jpg':
      case 'jpeg':
        return sharpInstance.jpeg().toBuffer();
      case 'webp':
        return sharpInstance.webp().toBuffer();
      case 'gif':
        return sharpInstance.gif().toBuffer();
      case 'avif':
        return sharpInstance.avif().toBuffer();
      default:
        return null;
    }
  }

  // Unsupported conversion
  return null;
};
