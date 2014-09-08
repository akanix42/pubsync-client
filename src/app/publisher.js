define(function (require) {
        var when = require('when'),
            walk = require('when-walk'),
            fs = require('fs'),
            path = require('path'),
            util = require('util');

        return Publisher;

        function Publisher(config, fileFactory, requester, debug) {
            var self = this;
            var config;

            self.publish = publish;

            function publish() {
                debug.log('publishing session started');
                return when(config)
                    .then(function (loadedConfig) {
                        config = loadedConfig;
                    })
                    .then(transferConfig)
                    .then(getFiles)
                    .then(transferFiles)
                    .then(publishFiles)
                    .then(function (result) {
                        if (result.wasSuccessful)
                            console.log('publishing complete.');
                        else
                            console.log('publishing failed.');
                        return result;
                    });
            };

            function transferConfig() {
                var uri = '/sessions/{sessionId}'.format({
                    sessionId: config.sessionId
                });
                console.log('session id: ' + config.sessionId);
                return when(requester.post(uri, config.rawConfig))
                    .then(function (response) {
                        var result = response.body;
                        if (!result.wasSuccessful)
                            throw result.err;
                    });
            }

            function getFiles() {
                return when(walk({
                    directory: config.sourcePath,
                    includeDirectories: true,
                    filterCallback: allowsFile
                }));
            }

            function allowsFile(file, stat) {
                for (var i = 0; i < config.filters.length; i++)
                    if (!config.filters[i].allowsFile(file))
                        return false;
                return true;
            }


            function transferFiles(files) {
                config.debugLogger.log('uploading files...');
                var i = 0;
                return when(transferNextFile())
                    .then(function (result) {
                        //                        console.log('result:' + result);
                        if (result !== undefined)
                            return transferNextFile();
                    })
                    .then(function () {
                        return files;
                    });

                function transferNextFile() {
                    if (i >= files.length)
                        return undefined;

                    return when(fileFactory.create(files[i]).transfer(config.sessionId))
                        .then(function (result) {
                            i++;
                            return transferNextFile();
                        });
                }
            }

            function publishFiles(files) {
                config.debugLogger.log('publishing files...');
                var uri = '/sessions/{sessionId}/publish'.format({ sessionId: config.sessionId});
                return when(requester.postJson(uri, makeFilesRelative(files)))
                    .then(function (response) {
                        var result = response.data;
                        result.wasSuccessful = true;
                        for (var i = 0; i < result.length; i++) {
                            if (!result[i].wasSuccessful) {
                                result.wasSuccessful = false;
                                break;
                            }
                        }
                        config.debugLogger.log(util.inspect(result));
                        return {error: result.error, wasSuccessful: result.wasSuccessful };
                    });
            }

            function makeFilesRelative(files) {
                for (var i = 0; i < files.length; i++)
                    files[i] = path.relative(config.sourcePath, files[i]) + (files[i].match(/\/$/) ? '/' : '');
                return files;
            }
        };

    }
)
;