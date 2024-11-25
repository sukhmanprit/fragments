// // src/model/data/index.js

// // Re-export the in-memory database strategy for now
// module.exports = require('./memory');

// if (process.env.DATA_BACKEND === 'aws') {
//     module.exports = require('./aws');  //For future when AWS is implemented
//   } else {
//     module.exports = require('./memory');  // Default to memory strategy
//   }
  
// src/model/data/index.js

// If the environment sets an AWS Region, we'll use AWS backend
// services (S3, DynamoDB); otherwise, we'll use an in-memory db.
module.exports = process.env.AWS_REGION ? require('./aws') : require('./memory');