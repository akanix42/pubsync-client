// Original source from http://stackoverflow.com/a/18926200/1090626.
// Thanks, Trevor!
var fs = require('fs')
    , path = require('path')
    , when = require('when')
    , nodefn = require('when/node/function');

function walk (directory, includeDir, matchExpression) {
    if (includeDir && includeDir !== true && !matchExpression)
        matchExpression = includeDir;
    var fileRegex;
    if (matchExpression)
        fileRegex = new RegExp(matchExpression);
    var results = [];
    return when.map(nodefn.call(fs.readdir, directory), function(file) {
        file = path.join(directory, file);
        return nodefn.call(fs.stat, file).then(function(stat) {
            if (stat.isFile()){
                if (matchExpression===undefined || fileRegex.test(file))
                    return results.push(file);
            }
            if (includeDir) { results.push(file + path.sep); }
            return walk(file, includeDir).then(function(filesInDir) {
                results = results.concat(filesInDir);
            });
        });
    }).then(function() {
        return results;
    });
}
module.exports = walk;