var stringFormat = require('stringformat'),
    util = require('util'),
    when = require('when');

var requirejs;
if (requirejs === undefined)
    requirejs = require('requirejs');

stringFormat.extendString();

requirejs.config({
    nodeRequire: require,
    baseUrl: 'app',
    paths: {
        'injector': '../lib/injector/injector',
        'extend': '../lib/extend/extend',
        'when-walk': '../lib/when-walk/when-walk-ex',
        'truthy': '../lib/truthy-falsy/truthy'
    }
});

process.on('uncaughtException', function(err) {
    console.error(util.inspect(err));
    process.exit(1);
});

requirejs(['composition-root'], function(CompositionRoot) {
    var compositionRoot = new CompositionRoot();
    when(compositionRoot.injector.resolve('Publisher'))
        .then(function (publisher) {
            return publisher.publish();
        })
        .then(function (result) {
            if (!result.wasSuccessful)
                process.exit(1);
        }).catch(function(err){
            console.error(util.inspect(err));
            process.exit(1);
        });

});

