define(function (require) {
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