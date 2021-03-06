'use strict';

const runner = require('../src/index')
    , Context = require('mock-lambda-context')
    , sinon = require('sinon')
    , expect = require('chai').expect;

require('co-mocha');
require('sinon-as-promised');

describe('Function Runner', function() {

    function *lambdaSuccess() {
        return {output: true}
    }

    function *lambdaFail() {
        throw new Error("Error");
    }

    function *lambdaNotFound() {
      throw new Error("Not found: couldnt find it");
    }

    function *lambdaNotFoundCustom() {
      throw new Error("Lost! Cant find it");
    }

   describe('Success', function() {
     describe('With success callback', () => {
       let ctx = new Context()
         , e = {input: true}
         , onInit = sinon.stub().resolves()
         , successFn = sinon.stub().resolves()
         , func = runner(lambdaSuccess, {
           onSuccess: successFn,
           onInit: onInit
         });

       before(function(done) {
         func(e, ctx, done)
       });

       it('should run', function() {
           expect(ctx.succeed.called).to.equal(true);
       });

       it('should invoke the onInit callback', function() {
         expect(onInit.calledOnce).to.eql(true)
       })

       it('should invoke the onInit callback', function() {
         let invocationArgs = onInit.args[0][0]
         expect(invocationArgs.request).to.eql({input: true})
       })

       it('should invoke the onSuccess callback', function() {
         expect(successFn.calledOnce).to.eql(true)
       })

       it('should invoke the onSuccess callback with the request and response', () => {
         let expectedPayload = {
           request  : {input: true},
           response : {output: true}
         }
         expect(successFn.calledWith(expectedPayload)).to.eql(true)
       });

       it('should succeed with lambdas return', function() {
           expect(ctx.succeed.calledWith({output: true})).to.equal(true);
       });
     });
     describe('Without success callback', () => {
       let ctx = new Context()
         , e = {input: true}
         , func = runner(lambdaSuccess);

       before(function(done) {
         func(e, ctx, done)
       });

       it('should run', function() {
           expect(ctx.succeed.called).to.equal(true);
       });

       it('should succeed with lambdas return', function() {
           expect(ctx.succeed.calledWith({output: true})).to.equal(true);
       });
     });

   });

   describe('Failure', function() {
     describe('Lambda throws error which contains Not found', function() {
       let ctx = new Context()
           , e = {input: true}
           , onInit = sinon.stub().resolves()
           , errorFn = sinon.stub().resolves()
           , func = runner(lambdaNotFound, {
             onError: errorFn,
             onInit: onInit
           });

       before(function(done) {
           func(e, ctx, () => done())
       });

       it('should fail', function() {
           expect(ctx.fail.called).to.equal(true);
       });

       it('should invoke the onInit callback', function() {
         let invocationArgs = onInit.args[0][0]
         expect(invocationArgs.request).to.eql({input: true})
       })

       it('should invoke fail callback', function() {
         expect(errorFn.called).to.equal(true)
       })

       it('should invoke fail callback with correct params', () => {
         expect(errorFn.calledWith({
           request: e,
           response: {
             error: new Error('Not found: couldnt find it'),
             formattedError: 'Not found: couldnt find it'
           }
         })).to.eql(true)
       });

       it('error message should begin with "Not found:" ', function() {
           let args = ctx.fail.getCall(0).args;
           expect(args[0]).to.match(/^Not found:/)
       });
     });

     describe('Lambda throws error which contains Not found - with custom flag', function() {
       let ctx = new Context()
           , e = {}
           , func = runner(lambdaNotFoundCustom, {notFoundRegexp: /Lost!/});

       before(function(done) {
           func(e, ctx, () => done())
       });

       it('should fail', function() {
           expect(ctx.fail.called).to.equal(true);
       });

       it('error message should begin with "Not found:" ', function() {
           let args = ctx.fail.getCall(0).args;
           expect(args[0]).to.match(/^Lost/)
       });
     });

     describe('Lambda throws another error', function() {
       let ctx = new Context()
           , e = {}
           , func = runner(lambdaFail);

       before(function(done) {
           func(e, ctx, () => done())
       });

       it('should fail', function() {
           expect(ctx.fail.called).to.equal(true);
       });

       it('error message should begin with "Error:" ', function() {
           let args = ctx.fail.getCall(0).args;
           expect(args[0]).to.match(/^Error:/)
       });
     });

     describe('Custom error message - fail', function() {
       let ctx = new Context()
           , e = {}
           , func = runner(lambdaFail, {addErrorPrefix: 'Oh, crud! '});

       before(function(done) {
           func(e, ctx, () => done())
       });

       it('should fail', function() {
           expect(ctx.fail.called).to.equal(true);
       });

       it('error message should begin with "Error:" ', function() {
           let args = ctx.fail.getCall(0).args;
           expect(args[0]).to.match(/^Oh, crud!/)
       });
     });

   });

   describe('Configuration Defaults', () => {

     describe('setDefaults({hello: world})', () => {
       before(() => {
         runner.setDefaults({hello: 'world'})
       });
       it('should set hello: world on defaults', () => {
         expect(runner.getDefaults().hello).to.eql('world')
       });
       after(() => {
         runner.resetDefaults()
       });
     });

     describe('setDefaults({onSuccess})', () => {
       let stub = sinon.stub().resolves();
       let ctx = new Context()
           , e = {}
           , func;
       before(() => {
         runner.setDefaults({onSuccess: stub})
         func = runner(lambdaSuccess)
       });
       before(function (done)  {
         func(e, ctx, done)
       });
       it('should call success callback', () => {
         expect(stub.called).to.be.ok
       });
       after(() => {
         runner.resetDefaults()
       });
     });

   });


});
