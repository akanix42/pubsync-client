var stringFormat = require('stringformat'),
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

var CompositionRoot = requirejs('composition-root');

var compositionRoot = new CompositionRoot();
when(compositionRoot.injector.resolve('Publisher'))
    .then(function (publisher) {
        return publisher.publish();
    })
    .then(function (result) {
        if (!result.wasSuccessful)
            process.exit(1);
    });
