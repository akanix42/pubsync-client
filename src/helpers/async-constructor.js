define(function (require) {
    var extend = require('extend'),
        when = require('when');
    return Constructor;

    function Constructor() {
        var self = this;

        self.constructorPromise = when.defer();
    }
});