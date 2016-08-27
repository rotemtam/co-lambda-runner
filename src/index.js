'use strict';

const co = require('co');

module.exports = function(lambda, config) {
  config = config || {};

  config = {
    addErrorPrefix: config.addErrorPrefix || 'Error: ',
    notFoundRegexp: config.notFoundRegexp || /Not found:/,
    notFoundMessage: config.notFoundMessage || 'Not found: could not find resource',
    defaultMessage: config.defaultMessage || 'Internal Error'
  }

  return function(e, ctx, cb) {
      co(
          function* () {
              let result = yield lambda(e, ctx);

              if (cb) {
                  cb(null, result)
              }

              ctx.succeed(result);
          }
      )
      .catch(
          function(err){
              let  msg;
              if( err  && config.notFoundRegexp.test(err)) {
                msg = err.message || err || config.notFoundMessage;
              } else {
                msg = `${config.addErrorPrefix}${err.message || config.defaultMessage}`
              }
              ctx.fail(msg);
              if(cb) {
                  cb(err)
              }
          }
      );
  }
};
