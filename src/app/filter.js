define(function (require) {
    var path = require('path');

    return Filter;


    function Filter(options) {
        var self = this;
        var regex = new RegExp(options.expression.replace(/\\\\/g, '/'), options.modifiers || 'i');
        var filterRegex = 'filter' in options ? new RegExp(options.filter.replace(/\\\\/g, '/'), options.modifiers || 'i') : false;
        self.allowsFile = allowsFile;
        self.excludesFile = excludesFile;

        function allowsFile(file, stat) {
            if (filterRegex && file.match(filterRegex))
                return adjustResult(false);

            return adjustResult(file.match(regex));
        }

        function adjustResult(fileMatches) {
            return options.type === 'include'
                ? fileMatches : !fileMatches
        }

        function excludesFile(file, stat) {
            var fileMatches = file.match(regex);
            return options.type === 'exclude' && fileMatches;
        }
    }
});