define(function (require) {
    var isObject = require('helpers/is-object'),
        util = require('util');

    var chars = ['/', '-', '\\', '|'];
    var nextChar = 0;


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
        this.debug = function () {
            if (isObject(arguments[0]))
                arguments[0] = JSON.stringify(arguments[0]);
            console.debug.apply(this, arguments);
        };
        this.spin = function () {
            process.stdout.cursorTo(0);
            process.stdout.write(chars[nextChar++]);
            if (nextChar >= chars.length) nextChar = 0;
        };
    }
});