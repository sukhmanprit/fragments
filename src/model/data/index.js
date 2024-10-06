// src/model/data/index.js

// Re-export the in-memory database strategy for now
module.exports = require('./memory');

if (process.env.DATA_BACKEND === 'aws') {
    module.exports = require('./aws');  //For future when AWS is implemented
  } else {
    module.exports = require('./memory');  // Default to memory strategy
  }
  
