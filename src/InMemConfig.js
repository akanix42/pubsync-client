define(function (require) {
    var Filter = require('./Filter'),
        Uuid = require('uuid-lib'),
        extend = require('./extend'),
        path = require('path');

    return Config;

    function Config(sourcePath, debug) {
        var self = this;
        var config = {
            debugLogger: debug,
            filters: [
                new Filter({expression: 'node_modules/$', type: 'exclude'}),
                new Filter({expression: '\\.idea/$', type: 'exclude'})
            ],
            sourcePath: path.resolve(sourcePath),
            sessionId: Uuid.raw(),
            destination: {
                protocol: 'http',
                host: 'localhost',
                port: 3000

            }
        };
        extend(self, config);
    }
});
