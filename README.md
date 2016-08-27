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

Example
```js
// ... function defined

module.exports = LambdaRunner(generatorFunc, {
  addErrorPrefix: 'Oh no! ',
  notFoundRegexp: /Lost!/,
  notFoundMessage: 'Lost! could not find resource',
  defaultMessage: 'EEEEEK!'
})

```
