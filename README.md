pubsync client
========

The client (sending) end of a tool for publishing files from 1 computer to another, written for node.js.

* Exclude files or folders using regular expressions
* Automatically deletes files that exist on the destination but not on the source (unless excluded)
* Automatically rolls back all changes if the publish fails
* Utilizes gzip compression for faster transfers
* Server available here: [nathantreid/pubsync-server]


Installation
---
```sh
npm install pubsync-client
```

Usage
---
```sh
node dist/pubsync-client.js path/to/config.json
```

Configuration
---
See the included [config.json], which is set up to publish all of the client source code (exluding the .idea and node_modules folders) to a local server.

License
---
MIT

Author
---
Nathan Reid


[nathantreid/pubsync-server]:https://github.com/nathantreid/pubsync-server
[config.json]:https://github.com/nathantreid/pubsync-client/blob/master/src/config.json