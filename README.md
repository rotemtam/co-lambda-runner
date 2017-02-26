# co-lambda-runner

Run ES6 generators as Lambda functions + some help for working with API Gateway

## Getting started

```bash
npm install --save co-lambda-runner
```

## Usage

```js
'use strict';

const LambdaRunner = require('co-lambda-runner')
  , DB = require('./db');

function *main(e) {
  let id = e.params.id;
  return yield DB.get(id);
}

module.exports = LambdaRunner(main);
```

## API

__LambdaRunner(generatorFunc, configObject)__ returns: a function with the signature lambda expects function(event, context, cb) {}

* generatorFunc - an ES6 generator function, should return its final value or throw an error.
Optionally, co-lambda-runner accepts a second
* config - Optionally, LambdaRunner accepts a second argument, a configuration object:
  * addErrorPrefix (string, default: 'Error: ') - always add this string as a prefix to errors thrown. This is useful for working with API Gateway which can only decide on which HTTP Status code to return by running the functions output through a Regular Expression.
  * notFoundRegexp (regex, default: /Not found:/): A regular expression to run on the functions error message to determine that the cause of the error was a not-found resource. In this case LambdaRunner will not prepend the _addErrorPrefix_ message. This is needed to work with API Gateway as well, in order to allow you to set a RegEx for setting 404 errors.
  * notFoundMessage (string, default: 'Not found: could not find resource'): a default message to display if the notFoundRegexp matched and no err.message is present
  * defaultMessage (string, default: Internal Error): a default message to show if no err.message is present on the thrown error.
  * onInit - function which returns a yieldable (promise, generator, etc.) to be called on lambda init
  * onSuccess - function which returns a yieldable (promise, generator, etc.) to be called on success
  * onError - function which returns a yieldable (promise, generator, etc.) to be called on fail

Example
```js
// ... function defined

module.exports = LambdaRunner(generatorFunc, {
  addErrorPrefix: 'Oh no! ',
  notFoundRegexp: /Lost!/,
  notFoundMessage: 'Lost! could not find resource',
  defaultMessage: 'EEEEEK!',
  onError: (payload) => {
    console.error(payload.response.error)
    return Promise.resolve()
  },
  onSuccess: (payload) => {
    console.log(payload.response)
    return Promise.resolve()
  },
  onInit: (payload) => {
    console.log(payload.request) // get event
    console.log(payload.context) // request context
    return Promise.resolve()
  }
})

```

__LambdaRunner.setDefaults(configObject)__

Sets default values for config which will be applied to subsequent instances created by `LambdaRunner()`

__LambdaRunner.getDefaults()__

Returns the current defaults

__LambdaRunner.resetDefaults()__

Resets the defaults to their default values
