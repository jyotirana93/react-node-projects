const allowedOriginsList = require('./allowedOrigins');

const corsOptionsHandler = {
  origin: function (origin, callback) {
    if (allowedOriginsList.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('not allowed by cors'));
    }
  },
  optionsSuccessStatus: 200,
};

module.exports = corsOptionsHandler;
