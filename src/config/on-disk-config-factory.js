define(function (require) {
    var fs = require('fs'),
        when = require('when'),
        Config = require('config/config');

    return OnDiskConfigFactory;

    function OnDiskConfigFactory(debugLogger) {
        var self = this;

        self.get = get;

        function get() {
            var deferred = when.defer();
            var configPath = process.argv[2];
            fs.readFile(configPath, 'utf8', parseFile);

            return deferred.promise;

            function parseFile(err, data) {
                if (err) {
                    debugLogger.log('Error: ' + err);
                    return;
                }

                data = JSON.parse(data);

                var config = new Config(data, debugLogger);
                when(config.constructorPromise)
                    .then(function () {
                        deferred.resolve(config);
                    });
            }
        }
    }
});