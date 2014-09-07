define(function (require) {
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