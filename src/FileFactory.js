define(function (require) {
    var util = require('util'),
        when = require('when'),
        fs = require('fs'),
        path = require('path'),
        File = require('./File');

    return FileFactory;

    function FileFactory(config, requester, sender, debug) {
        var self = this;
        self.create = create;

        function create(filePath) {
            return new File(filePath, makeRelativePath(filePath), requester, sender, debug);
        }

        function makeRelativePath(filePath) {
            if (!filePath)
                debugger;
            return filePath.replace(config.sourcePath, '');
        }
    }
});