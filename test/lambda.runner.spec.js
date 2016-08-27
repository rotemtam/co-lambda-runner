'use strict';

const runner = require('../src/index')
    , Context = require('mock-lambda-context')
    , sinon = require('sinon')
    , expect = require('chai').expect;

require('co-mocha');
require('sinon-as-promised');

describe('Function Runner', function() {

    function *lambdaSuccess() {
        return true
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
       let ctx = new Context()
         , e = {}
         , func = runner(lambdaSuccess);

       before(function(done) {
         func(e, ctx, done)
       });

       it('should run', function() {
           expect(ctx.succeed.called).to.equal(true);
       });

       it('should succeed with lambdas return', function() {
           expect(ctx.succeed.calledWith(true)).to.equal(true);
       });

   });

   describe('Failure', function() {
     describe('Lambda throws error which contains Not found', function() {
       let ctx = new Context()
           , e = {}
           , func = runner(lambdaNotFound);

       before(function(done) {
           func(e, ctx, () => done())
       });

       it('should fail', function() {
           expect(ctx.fail.called).to.equal(true);
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


});
