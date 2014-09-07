define(function (require) {
    var Injector = require('injector'),
        FileFactory = require('file-factory'),
        Requester = require('requester'),
        Sender = require('sender'),
        Publisher = require('publisher'),
        OnDiskConfigFactory = require('config/on-disk-config-factory'),
        DebugLogger = require('debug-logger');

    return CompositionRoot;

    function CompositionRoot() {
        var self = this;
        var injector = self.injector = new Injector(true);

        injector.register('FileFactory', FileFactory, true);
        injector.register('Requester', Requester);
        injector.register('Sender', Sender);
        injector.register('Publisher', Publisher);
        injector.register('Debug', DebugLogger, true);
        injector.register('DebugLogger', DebugLogger, true);
        injector.register('ConfigFactory', OnDiskConfigFactory, true);
        injector.register('Config', function (configFactory) { return configFactory.get(); }, true);
    }
});