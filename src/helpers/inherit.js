define(function (require) {
    var extend = require('extend');
    return inherit;

    function inherit(base, self) {
        var args = Array.prototype.slice.call(arguments, 2);
        base.apply(self, args);

        self.base = extend({base: self.base}, self);
    }
});