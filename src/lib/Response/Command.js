/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

(function (exports) {
	'use strict';

	var Klass = function ResponseCommand () {
		this.type = 'responseRequest';
		this.file = {};
	};
	Klass.inherit(ResponseRule);
	var prop = Klass.prototype;

	prop.isMatch = function (forwarder) {
		return ~['localhost', '127.0.0.1'].indexOf(forwarder.location.hostname);
	};
	prop.wsResponse = function (forwarder) {
		var defer = Deferred();

		var forw = forwarder;
		if (forw.request.getHeader('upgrade') !== 'websocket') {
			Deferred.next(defer.call.bind(defer, {
				'body' : JSON.stringify({
					'result' : 'ng',
					'data' : {
						'message' : 'require_websocket_connection'
					}
				}),
				'type' : 'application/json'
			}));
			return defer;
		}

		var sec_key = forw.request.getHeader('sec-websocket-key').trim();
		sec_key += '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
		var sha1 = new jsSHA(sec_key, 'TEXT');
		var base64 = sha1.getHash('SHA-1', 'B64');
		Deferred.next(defer.call.bind(defer, {
			'data' : [
				'HTTP/1.1 101 Switching Protocols',
				'Upgrade: websocket',
				'Connection: Upgrade',
				'Sec-WebSocket-Accept: ' + base64,
				'Date: ' + (new Date).toUTCString(),
				'', ''
			].join('\r\n')
		}));

		return defer;
	};

	exports[Klass.name] = Klass;
})(this);