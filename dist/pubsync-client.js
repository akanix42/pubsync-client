(function() {
var requirejs = require('requirejs');
var define = requirejs.define;

define('extend',['require'],function(require){
    return extend;

    function extend() {
        var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false,
            toString = Object.prototype.toString,
            hasOwn = Object.prototype.hasOwnProperty,
            push = Array.prototype.push,
            slice = Array.prototype.slice,
            trim = String.prototype.trim,
            indexOf = Array.prototype.indexOf,
            class2type = {
                "[object Boolean]": "boolean",
                "[object Number]": "number",
                "[object String]": "string",
                "[object Function]": "function",
                "[object Array]": "array",
                "[object Date]": "date",
                "[object RegExp]": "regexp",
                "[object Object]": "object"
            },
            jQuery = {
                isFunction: function (obj) {
                    return jQuery.type(obj) === "function"
                },
                isArray: Array.isArray ||
                    function (obj) {
                        return jQuery.type(obj) === "array"
                    },
                isWindow: function (obj) {
                    return obj != null && obj == obj.window
                },
                isNumeric: function (obj) {
                    return !isNaN(parseFloat(obj)) && isFinite(obj)
                },
                type: function (obj) {
                    return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
                },
                isPlainObject: function (obj) {
                    if (!obj || jQuery.type(obj) !== "object" || obj.nodeType) {
                        return false
                    }
                    try {
                        if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                            return false
                        }
                    } catch (e) {
                        return false
                    }
                    var key;
                    for (key in obj) {}
                    return key === undefined || hasOwn.call(obj, key)
                }
            };
        if (typeof target === "boolean") {
            deep = target;
            target = arguments[1] || {};
            i = 2;
        }
        if (typeof target !== "object" && !jQuery.isFunction(target)) {
            target = {}
        }
        if (length === i) {
            target = this;
            --i;
        }
        for (i; i < length; i++) {
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];
                    if (target === copy) {
                        continue
                    }
                    if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && jQuery.isArray(src) ? src : []
                        } else {
                            clone = src && jQuery.isPlainObject(src) ? src : {};
                        }
                        // WARNING: RECURSION
                        target[name] = extend(deep, clone, copy);
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }
        return target;
    }
});
define('truthy',[],function () {
    return truthy;

    function truthy(value) {
        return typeof value !== 'undefined' && value;
    }
})
;
define('injector',['require','extend','truthy','when'],function (require) {
    var extend = require('extend'),
        truthy = require('truthy'),
        when = require('when');
    return Injector;


    function InitializerFactory(useAsync) {
        var self = this;

        self.get = get;
        function get(self, name, item, isSingleton) {
            var InitializerFn = useAsync ? AsyncInitializer : Initializer;

            return new InitializerFn(self, name, item, isSingleton);
        }
    }

    function Injector(useAsync) {
        var self = this;
        this.fixDependencyCasing = firstLetterUpperCase;

        var initializerFactory = new InitializerFactory(useAsync);

        function resolve(name, dependencyAbove, dependencyTree) {
            name = self.fixDependencyCasing(name);
            if (!(name in self.dependencies)) {
                debugger;
                throw name + ' not registered';
            }
            if (truthy(dependencyAbove) && name in dependencyTree)
                throw dependencyAbove + ' has a circular dependency on ' + name;
            dependencyTree = extend({}, dependencyTree);
            dependencyTree[name] = '';

            return self.dependencies[name].initializer.initialize(dependencyTree);
        }

        function resolveAsync(name, dependencyAbove, dependencyTree) {
            return when(resolve(name, dependencyAbove, dependencyTree));
        }

        var injector = {

            dependencies: {},

            getDependencies: function (name, dependencies, dependencyTree) {
                return dependencies.length === 1 && dependencies[0] === '' ? []
                    : dependencies.map(function (value) {
                        return self.resolve(value, name, dependencyTree);
                    }
                );
            },

            register: function (name, item, isSingleton) {
                self.dependencies[name] = {item: item, initializer: initializerFactory.get(self, name, item, isSingleton)};
            },

            resolve: function (name) {
                return useAsync
                    ? resolveAsync(name, undefined, {})
                    : resolve(name, undefined, {});
            }

        };
        extend(self, injector);

        function allUpperCase(name) {
            return name.toUpperCase();
        }

        function firstLetterUpperCase(value) {
            return value[0].toUpperCase() + value.substring(1);
        }
    }

    function Initializer(injector, name, item, isSingleton) {
        var self = this;
        createInitializationSteps();

        function createInitializationSteps() {
            if (isFunction(item))
                createFunctionInitializationSteps();
            else
                createObjectInitializationSteps();
        }

        function isFunction(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
        }

        function createFunctionInitializationSteps() {
            var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
            var text = item.toString();
            var dependencies = text.match(FN_ARGS)[1].split(',');
            dependencies = dependencies.map(function (dependency) {
                return dependency.replace(/\s+/g, '');
            });

            self.initialize = function (dependencyTree) {
                var initializedItem = construct(item, injector.getDependencies(name, dependencies, dependencyTree));
                if (isSingleton) {
                    item = initializedItem;
                    createObjectInitializationSteps();
                }

                return initializedItem;
            };
        }

        function construct(constructor, args) {
            function F() {
                return constructor.apply(this, args);
            }

            F.prototype = constructor.prototype;
            return new F();
        }

        function createObjectInitializationSteps() {
            self.initialize = function () {
                return item;
            };
        }
    }

    function AsyncInitializer(injector, name, item, isSingleton) {
        var self = this;
        var hasBeenInitialized = false;
        createInitializationSteps();

        function createInitializationSteps() {
            if (isFunction(item))
                createFunctionInitializationSteps();
            else
                createObjectInitializationSteps();
        }

        function isFunction(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
        }

        function createFunctionInitializationSteps() {
            var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
            var text = item.toString();
            var dependencies = text.match(FN_ARGS)[1].split(',');
            dependencies = dependencies.map(function (dependency) {
                return dependency.replace(/\s+/g, '');
            });

            self.initialize = function (dependencyTree) {
                return when.all(injector.getDependencies(name, dependencies, dependencyTree))
                    .then(function (dependencies) {
                        if (hasBeenInitialized)
                            return item;

//                        console.log(name);

                        var initializedItem = construct(item, dependencies);
                        if (isSingleton) {
                            item = initializedItem;
                            createObjectInitializationSteps();
                            hasBeenInitialized = true;
                        }
                        return 'constructorPromise' in initializedItem
                            ? initializedItem.constructorPromise
                            : initializedItem;
                    });
            };
        }

        function construct(constructor, args) {
            function F() {
                return constructor.apply(this, args);
            }

            F.prototype = constructor.prototype;
            return new F();
        }

        function createObjectInitializationSteps() {
            self.initialize = function () {
                return item;
            };
        }
    }
});
define('file-hasher',['require','when','fs','crypto'],function (require) {
    var when = require('when'),
        fs = require('fs');

    return generateFileHash;

    function generateFileHash(filePath) {
        var crypto = require('crypto'),
            stream = fs.createReadStream(filePath);

        var hasher = crypto.createHash('md5');
        var deferred = when.defer();

        stream.on('data', function (data) {
            hasher.update(data, 'utf8')
        });

        stream.on('end', function () {
            var hash = hasher.digest('hex'); // 34f7a3113803f8ed3b8fd7ce5656ebec
            deferred.resolve({hash: hash, filePath: filePath});
        });

        return deferred.promise;

    }

});
define('File',['require','util','when','fs','file-hasher'],function (require) {
    var util = require('util'),
        when = require('when'),
        fs = require('fs'),
        fileHasher = require('file-hasher')
        ;

    return File;

    function File(filePath, relativePath, requester, sender, debug) {
        var self = this;
        self.transfer = transfer;
        self.filePath = filePath;
        self.relativePath = relativePath;

        function transfer(sessionId) {
            self.sessionId = sessionId;
            return when(getFileStats())
                .then(diffAndSend)
            //.then(sendFileIfDifferent);
        }

        function diffAndSend(stats) {
            if (stats.stats.isFile())
                return when(diffFile(stats))
                    .then(sendFileIfDifferent);
        }

        function getFileStats() {
            var deferred = when.defer();
            fs.stat(filePath, function (err, stats) {
                self.stats = stats;

                deferred.resolve({err: err, stats: stats});
            });
            return deferred.promise;
        }

        function diffFile(stats) {
            return when(performQuickDiff(stats))
                .then(performHashDiffIfNecessary);
            function performQuickDiff(stats) {
                //            debug.log(stats);
                var uri = '/sessions/{sessionId}/files/{filePath}/diffs/quick?size={fileStats.size}'.format({
                        sessionId: self.sessionId,
                        filePath: encodeURIComponent(relativePath),
                        fileStats: stats.stats}
                );
                return when(requester.get(uri));
            }

            function performHashDiffIfNecessary(quickDiffResult) {
                var diffResult = {
                    isDifferent: JSON.parse(quickDiffResult.body)
                };
                return when(diffResult.isDifferent ? diffResult : when(fileHasher(filePath).then(performHashDiff)));
            }

            function performHashDiff(diffInfo) {
                var uri = '/sessions/{sessionId}/files/{filePath}/diffs/hash?hash={hash}'.format({
                        sessionId: self.sessionId,
                        filePath: encodeURIComponent(relativePath),
                        hash: diffInfo.hash}
                );
                return when(requester.getJson(uri))
                    .then(function (response) {
                        return {error: response.error, isDifferent: !response.error ? response.data : undefined};
                    });
            }
        }

        function sendFileIfDifferent(diffResult) {
//            debug.log('send if different');
            if (diffResult.error)
                console.log(diffResult.error);
            else if (diffResult.isDifferent)
                return sendFile();
        }

        function sendFile() {
//            console.log('sending file');
            return sender.sendFile(self, self.stats);
        }

    }
});
define('file-factory',['require','util','when','fs','path','./File'],function (require) {
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
define('requester',['require','when','request','./extend'],function (require) {
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
define('sender',['require','zlib','when','http','path','fs','util','extend'],function (require) {
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
// Original source from http://stackoverflow.com/a/18926200/1090626.
// Thanks, Trevor!
define('when-walk',['require','fs','path','when','when/node/function'],function (require) {
    var fs = require('fs')
        , path = require('path')
        , when = require('when')
        , nodefn = require('when/node/function');

    return walk;
    
    function walk(options) {
        var directory = options.directory, includeDir = options.includeDirectories, filterCallback = options.filterCallback;
        var results = [];
        return when.map(nodefn.call(fs.readdir, directory), function (file) {
            file = path.join(directory, file);
            return nodefn.call(fs.stat, file).then(function (stat) {
                var name = stat.isFile() ? file : file + '/';
                if (!options.filterCallback(name, stat))
                    return;
                if (stat.isFile())
                    return results.push(name);
                if (includeDir) results.push(file);

                return walk({directory: file, includeDirectories: includeDir, filterCallback: filterCallback}).then(function (filesInDir) {
                    results = results.concat(filesInDir);
                });
            });
        }).then(function () {
            return results;
        });
    }
});
define('publisher',['require','when','when-walk','fs','path','util'],function (require) {
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
                        //                        if (!result.wasSuccessful)
                        //                            throw 'Publishing failed';
                        return {error: result.error, wasSuccessful: result.wasSuccessful };
                    });
            }

            function makeFilesRelative(files) {
                for (var i = 0; i < files.length; i++)
                    files[i] = path.relative(config.sourcePath, files[i]);
                return files;
            }
        };

    }
)
;
define('filter',['require','path'],function (require) {
    var path = require('path');

    return Filter;


    function Filter(options) {
        var self = this;
        var regex = new RegExp(options.expression.replace(/\\\\/g, '/'));

        self.allowsFile = allowsFile;
        self.excludesFile = excludesFile;

        function allowsFile(file, stat) {
            var fileMatches = file.match(regex);
            return options.type === 'include'
                ? fileMatches : !fileMatches;
        }


        function excludesFile(file, stat) {
            var fileMatches = file.match(regex);
            return options.type === 'exclude' && fileMatches;
        }
    }
});
define('helpers/is-object',['require'],function(require){
    return isObject;


    function isObject(val) {
        if (val === null) { return false;}
        return ( (typeof val === 'function') || (typeof val === 'object') );
    }
});

define('helpers/async-constructor',['require','extend','when'],function (require) {
    var extend = require('extend'),
        when = require('when');
    return Constructor;

    function Constructor() {
        var self = this;

        self.constructorPromise = when.defer();
    }
});
define('helpers/inherit',['require','extend'],function (require) {
    var extend = require('extend');
    return inherit;

    function inherit(base, self) {
        var args = Array.prototype.slice.call(arguments, 2);
        base.apply(self, args);

        self.base = extend({base: self.base}, self);
    }
});
define('config/config',['require','filter','uuid-lib','extend','path','helpers/is-object','helpers/async-constructor','helpers/inherit','fs'],function (require) {
    var Filter = require('filter'),
        Uuid = require('uuid-lib'),
        extend = require('extend'),
        path = require('path'),
        isObject = require('helpers/is-object'),
        AsyncConstructor = require('helpers/async-constructor'),
        inherit = require('helpers/inherit'),
        fs = require('fs');

    return Constructor;

    function Constructor(config, debugLogger) {
        var self = this;
        self.rawConfig = extend(true, {}, config);

        inherit(AsyncConstructor, self);

        config.debugLogger = debugLogger;
        config.sessionId = Uuid.raw();
        //        debugLogger.log(config);

        config.sourcePath = path.resolve(config.sourcePath);
        fs.exists(config.sourcePath, function (exists) {
            if (!exists)
                debugLogger.log('The source path must exist!');
            self.constructorPromise.resolve();
        });
        parseFilters(config.filters);

        extend(self, config);

        function parseFilters() {
            if (!('filters' in config) || !isObject(config.filters))
                return;
            var filters = config.filters;

            for (var filterIndex = 0; filterIndex < filters.length; filterIndex++)
                filters[filterIndex] = new Filter(filters[filterIndex]);
        }
    }
});
define('config/on-disk-config-factory',['require','fs','when','config/config'],function (require) {
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
define('debug-logger',['require','helpers/is-object','util'],function (require) {
    var isObject = require('helpers/is-object'),
        util = require('util');
    return DebugLogger;

    function DebugLogger() {
        this.isEnabled = false;
        this.log = function () {
//            console.log('isObject: {isObject}'.format({isObject: isObject(arguments[0])}));
//            console.log('object: {obj}'.format({obj: JSON.stringify(arguments[0])}));
            if (isObject(arguments[0]))
                arguments[0] = JSON.stringify(arguments[0]);
            console.log.apply(this, arguments);
        };
    }
});
define('composition-root',['require','injector','file-factory','requester','sender','publisher','config/on-disk-config-factory','debug-logger'],function (require) {
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

requirejs(['composition-root'], function(CompositionRoot) {
    var compositionRoot = new CompositionRoot();
    when(compositionRoot.injector.resolve('Publisher'))
        .then(function (publisher) {
            return publisher.publish();
        })
        .then(function (result) {
            if (!result.wasSuccessful)
                process.exit(1);
        });

});


define("main", function(){});

}());