/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

(function (exports) {
	'use strict';

	var Klass = function ResponseCommand () {};
	Klass.inherit(EventEmitter);
	var prop = Klass.prototype;

	prop.isMatch = function (forwarder) {
		return ~['localhost', '127.0.0.1'].indexOf(forwarder.location.hostname);
	};
	prop.wsResponse = function (forwarder) {
		var forw = forwarder;
		if (forw.request.getHeader('upgrade') !== 'websocket') {
			return this.wsResponseError();
		}
		return this.wsResponseSuccess(forw.request.getHeader('sec-websocket-key'));
	};
	prop.wsResponseError = function () {
		var defer = Deferred();
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
	};
	prop.wsResponseSuccess = function (sec_key) {
		var defer = Deferred();
		var sha1 = new jsSHA(sec_key.trim() + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'TEXT');
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
	prop.wsConnect = function (forwarder) {
		this.wsRead([], forwarder);
	};
	prop.wsRead = function (frames, forwarder) {
		var forw = forwarder;
		var browser = forw.sockets.get('browser');
		chrome.socket.read(browser, function (evn) {
			if (!evn.data.byteLength) {
				return forwarder.done();
			}
			var wsf = (new WebSocketFrame()).parse(evn.data);
			frames.push(wsf);
			if (!wsf.fin) {
				this.wsRead(frames, forwarder);
				return;
			}
			var text = frames.map(function (frame) {
				return frame.text;
			}).join('');
			this.emitEvent('wsRead', [text]);
			console.debug(text.length, text);
			this.wsWrite(Array(100).join('123')+'abcd', forwarder);
			this.wsRead([], forwarder);
		}.bind(this));
	};
	prop.wsWrite = function (text, forwarder) {
		var forw = forwarder;
		var browser = forw.sockets.get('browser');
		var ab = WebSocketFrame.t2wsab(text);
		chrome.socket.write(browser, ab, function (evn) {
			if (evn.bytesWritten !== ab.byteLength) {
				throw 'command chrome.socket.write';
			}
		}.bind(this));
	};

	exports[Klass.name] = Klass;
})(this);