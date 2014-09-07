define(function (require) {
    var isObject = require('helpers/is-object');
    process.on('uncaughtException', function (err) {
        console.error(isObject(err) ? err.stack : err);
    });
});
