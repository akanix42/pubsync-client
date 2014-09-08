define(function (require) {
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
            else
                return when(sendDirectory());
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

        function sendDirectory() {
            var uri = '/sessions/{sessionId}/directories'.format({
                    sessionId: self.sessionId
                }
            );
            return when(requester.postJson(uri, {path: relativePath}));

        }
    }
});