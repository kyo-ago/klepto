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

	Klass.isMatch = function (forwarder) {
		return ~['localhost', '127.0.0.1'].indexOf(forwarder.location.hostname);
	};
	prop.response = function (forwarder) {
		var fwd = forwarder;
		if (fwd.request.getHeader('upgrade') !== 'websocket') {
			return this.responseError();
		}
		return this.responseSuccess(fwd.request.getHeader('sec-websocket-key'));
	};
	prop.responseError = function () {
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
	prop.responseSuccess = function (sec_key) {
		var defer = Deferred();
		var sec = WebSocketConnect.getAcceptKey(sec_key);
		Deferred.next(defer.call.bind(defer, {
			'data' : [
				'HTTP/1.1 101 Switching Protocols',
				'Upgrade: websocket',
				'Connection: Upgrade',
				'Sec-WebSocket-Accept: ' + sec,
				'Date: ' + (new Date).toUTCString(),
				'', ''
			].join('\r\n')
		}));
		return defer;
	};
	prop.connect = function (forwarder) {
		var fwd = forwarder;
		var socket = fwd.sockets.get('browser');
		this.ws = (new WebSocketConnect()).connect(socket);
		this.ws.addListener('close', fwd.disconnect.bind(fwd));
		this.ws.addListener('read', function (data) {
			var param = JSON.parse(data);
			if (param.type = 'save') {
				this.emitEvent('save', [param.file])
			}
		}.bind(this));
	};
	prop.sendMessage = function (message) {
		this.ws.sendText(JSON.stringify({
			'type' : 'message',
			'message' : message
		}));
	};

	exports[Klass.name] = Klass;
})(this);