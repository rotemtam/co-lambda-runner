'use strict';

const co = require('co');

let DEFAULTS = getOriginalDefaults()

const runnerFactory = function(lambda, config) {
  config = config || {}
  config = applyDefaults(config);

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
              yield config.onInit({
                request: e,
                context: ctx
              })
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

runnerFactory.setDefaults = function(conf) {
  DEFAULTS = Object.assign({}, DEFAULTS, conf)
}

runnerFactory.getDefaults = function() {
  return DEFAULTS
}

runnerFactory.resetDefaults = function() {
  DEFAULTS = getOriginalDefaults()
}

function getOriginalDefaults() {
  return {
    addErrorPrefix:  'Error: ',
    notFoundRegexp:  /Not found:/,
    notFoundMessage:  'Not found: could not find resource',
    defaultMessage:  'Internal Error',
    onInit: () => Promise.resolve(),
    onError:  () => Promise.resolve(),
    onSuccess:  () => Promise.resolve(),
    debug: false,
  }
}

function applyDefaults(conf) {
  return Object.assign({}, DEFAULTS, conf)
}


module.exports = runnerFactory
