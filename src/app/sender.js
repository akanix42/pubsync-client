define(function (require) {
    var zlib = require('zlib'),
        when = require('when'),
        http = require('http'),
        path = require('path'),
        fs = require('fs'),
        util = require('util'),
        extend = require('extend');


    var excludeFromGzip = {
        jpg: '',
        png: '',
    };

    return Sender;

    function Sender(config, debug) {
        var self = this;

        self.sendFile = sendFile;

        function getRequestParameters(file) {
            var parameters = {
                timeout: 120000,
                method: 'POST',
                path: '/sessions/{sessionId}/files/{filePath}'.format({
                    filePath: encodeURIComponent(file.relativePath),
                    sessionId: config.sessionId
                }),
                host: config.destination.host,
                port: config.destination.port
            };
            if (shouldUseGzip(file))
                parameters.headers = { 'Content-Encoding': 'gzip'};

            return parameters;
        }

        function shouldUseGzip(file) {
            var fileExtension = path.extname(file.filePath).replace(/^\./, '').toLowerCase();
            var shouldGzip = !(fileExtension in excludeFromGzip);
//            console.log('should gzip: ' + shouldGzip);
            return shouldGzip;
        }

        function sendFile(file, stats) {
            if (!stats.isFile())
                return;
//            console.log(util.inspect(file));
//            console.log(config.sessionId);

            var deferred = when.defer();
            var request = http.request(getRequestParameters(file), function (res) {
                if (res.statusCode < 399) {
                    var text = "";
                    res.on('data', function (chunk) {
                        text += chunk;
                    });
                    res.on('end', function (data) {
                        deferred.resolve(text);
                    });
                } else {
                    console.log("ERROR", res.statusCode)
                }
            });
            var fileInputStream = fs.createReadStream(file.filePath);
            if (shouldUseGzip(file)) {
                var gzip = zlib.createGzip();
                fileInputStream.pipe(gzip).pipe(request);
            }
            else
                fileInputStream.pipe(request);


            return when(deferred.promise);


        }
    }
})
;