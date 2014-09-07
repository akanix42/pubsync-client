var requirejs = require('requirejs'),
    stringFormat = requirejs('stringformat'),
    when = require('when');

stringFormat.extendString();

requirejs.config({
    nodeRequire: require,
    baseUrl: './',
    paths: {

    }
});

var CompositionRoot = requirejs('./composition-root');

var compositionRoot = new CompositionRoot();
when(compositionRoot.injector.resolve('Publisher'))
    .then(function (publisher) {
        return publisher.publish();
    })
    .then(function (result) {
        if (!result.wasSuccessful)
            process.exit(1);
    });
