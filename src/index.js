'use strict';

const co = require('co');

module.exports = function(lambda, config) {
  config = config || {};

  config = {
    addErrorPrefix: config.addErrorPrefix || 'Error: ',
    notFoundRegexp: config.notFoundRegexp || /Not found:/,
    notFoundMessage: config.notFoundMessage || 'Not found: could not find resource',
    defaultMessage: config.defaultMessage || 'Internal Error',
    onError: config.onError || Promise.resolve,
    onSuccess: config.onSuccess || Promise.resolve,
    debug: config.debug || false,
  }

  function formatErrorMessage(err) {
    let  msg;

    if( err  && config.notFoundRegexp.test(err)) {
      msg = err.message || err || config.notFoundMessage;
    } else {
      msg = `${config.addErrorPrefix}${err.message || config.defaultMessage}`
    }

    return msg
  }

  function logError(msg) {
    if (config.debug)
      console.error(msg)
  }

  return function(e, ctx, cb) {
      co(
          function* () {
              let result = yield lambda(e, ctx);
              yield config.onSuccess({
                request: e,
                response: result
              })
              if (cb) {
                  cb(null, result)
              }

              ctx.succeed(result);
          }
      )
      .catch(
          function(err){

              let msg = formatErrorMessage(err)

              co(function *() {
                try {
                  yield config.onError({
                    request: e,
                    response: {
                      error: err,
                      formattedError: msg
                    }
                  })
                } catch(err) {
                  logError('Failed to invoke error callback')
                  logError(err)
                }

                ctx.fail(msg);
                if(cb) {
                    cb(err)
                }
              })

          }
      );
  }
};
