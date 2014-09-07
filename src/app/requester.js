define(function (require) {
    var when = require('when'),
        request = require('request'),
        extend = require('./extend');

    //        request =request.defaults({'proxy':'http://127.0.0.1:8888'});
    return Requester;

    function Requester(config, debug) {
        var self = this;
        self.makeRequest = makeRequest;
        self.get = get;
        self.getJson = getJson;
        self.post = post;
        self.postJson = postJson;
        //        console.log('requester')
        function makeRequest(uri, method) {
            //            debug.log(uri);
            var requestOptions = getRequestOptions();
            requestOptions.method = method;
            requestOptions.urlPath = uri;
            requestOptions.host += ':' + requestOptions.port;
            var deferred = when.defer();
            var uri = '{protocol}://{host}{urlPath}'.format(requestOptions);
            //            debug.log(uri);
            request.get(uri, function (err, response, body) {
                deferred.resolve({err: err, response: response, body: body});
            });
            return deferred.promise;
        }

        function get(uri) {
            return makeRequest(uri, 'GET');
        }

        function getJson(uri) {
            return when(get(uri))
                .then(function (response) {
                    response.data = JSON.parse(response.body);
                    return response;
                })
        }

        function getRequestOptions() {
            return {
                protocol: 'http',
                host: 'localhost',
                //    path: '/sessions/1/files/main.js',
                path: '/sessions/1/files/main.js',
                //    path: '/upload/main.js',
                port: 3000,
                timeout: 120000,
                method: 'POST',
                headers: {
                    'Content-Encoding': 'gzip',
                    //'Content-Type': 'application/x-www-form-urlencoded',
                    //    'Content-Length': post_data.length
                }
            };
        }

        function post(uri, data) {
            var deferred = when.defer();
            var requestOptions = extend({urlPath: uri}, config.destination);
            //            debug.log('config: {config}'.format({config: JSON.stringify(config)}));
            uri = '{protocol}://{host}:{port}{urlPath}'.format(requestOptions);
            //            debug.log(uri);
            request.post(uri, {json: data}, function (err, response, body) {
                deferred.resolve({err: err, response: response, body: body});
            });
            return when(deferred.promise);
        }

        function postJson(uri, data) {
            return when(post(uri, data))
                .then(function (response) {
                    response.data = response.body;
                    return response;
                });
        }
    }
});