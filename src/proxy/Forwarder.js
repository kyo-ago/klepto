/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function Forwarder (option) {
		this.sockets = new SocketTable();

		this.option = utils.extend({
			'socketId' : undefined,
			'timeout' : 3000
		}, option);

		if (!this.option.socketId) {
			this.emitEvent('missing socketId', arguments);
			return;
		}
		this.sockets.add('browser', this.option.socketId);

		this.timeoutId = setTimeout(function () {
			this.disconnect();
		}.bind(this), this.option.timeout);
		this.addListener('close', function () {
			clearTimeout(this.timeoutId);
		}.bind(this));

		this.request = undefined;
		this.location = undefined;
		this.response = undefined;
	};
	Klass.inherit(Waterfall);
	var prop = Klass.prototype;

	prop.methods = [
		function browserSetNoDelay (done) {
			var sid = this.sockets.get('browser');
			chrome.socket.setNoDelay(sid, true, function () {
				done();
			}.bind(this));
		},
		function browserRead (done) {
			var sid = this.sockets.get('browser');
			chrome.socket.read(sid, function (evn) {
				if (!evn.data.byteLength) {
					this.disconnect();
					return;
				}
				this.request = new HttpRequest(utils.ab2t(evn.data));
				if (!this.request.isComplete()) {
					this.browserRead(done);
					return;
				}
				this.location = Location.parse(this.request.getURL());
				done();
			}.bind(this));
		},
		function serverRequest (done) {
			chrome.socket.create('tcp', function (info) {
				var sid = info.socketId;
				this.sockets.add('server', sid);
				done();
			}.bind(this));
		},
		function serverConnect (done) {
			var sid = this.sockets.get('server');
			var loc = this.location;
			var host = loc.hostname;
			var port = loc.port || 80;
			chrome.socket.connect(sid, host, port, function (resultCode) {
				if (resultCode === 0) {
					done();
					return;
				}
				// -105 is DNS resolution failed
				if (resultCode !== -105 || resultCode !== -3) {
					this.emitEvent('error', arguments);
				}
				this.disconnect();
			}.bind(this));
		},
		function serverWrite (done) {
			var sid = this.sockets.get('server');
			var text = this.request.getText();
			var len = text.length;
			var buffer = utils.t2ab(text);
			chrome.socket.write(sid, buffer, function (evn) {
				if (evn.bytesWritten !== len) {
					this.emitEvent('error', arguments);
					return;
				}
				done();
			}.bind(this));
		},
		function serverRead (done, response) {
			response = response || '';
			var sid = this.sockets.get('server');
			chrome.socket.read(sid, function (evn) {
				if (!evn.data.byteLength) {
					this.sockets.remove('server');
					done();
					return;
				}
				var read_data = utils.ab2t(evn.data);
				if (!this.response) {
					response += read_data;
					if (!response.match('\r\n\r\n')) {
						this.serverRead(done, response);
						return;
					}
					this.response = new HttpResponse(response);
				} else {
					this.response.body += read_data;
					this.response.text = this.response.getHeaderText() + '\r\n\r\n' + this.response.body;
				}
				if (!this.response.isComplete()) {
					this.serverRead(done);
					return;
				}
				this.sockets.remove('server');
				done();
			}.bind(this));
		},
		function browserWrite (done) {
			var text = this.response.getText();
			var len = text.length;
			var buffer = utils.t2ab(text);
			var sid = this.sockets.get('browser');
			chrome.socket.write(sid, buffer, function (evn) {
				if (evn.bytesWritten !== len) {
					this.emitEvent('error', arguments);
					return;
				}
				done();
			}.bind(this));
		},
		// calling "done" event
		function done () {
			this.disconnect();
		}
	].map(function (method) {
		return prop[method.name] = method;
	});

	prop.disconnect = function () {
		this.sockets.removeAll();
		this.deferred.cancel();
	};
	prop.setResponse = function (file) {
		var header = [
			'HTTP/1.1 200 OK',
			'Connection: close',
			'Content-Length: ' + file.data.length,
			'Content-Type: ' + file.type,
			'Date: ' + (new Date).toUTCString(),
			'Cache-control: private'
		].join('\r\n');
		this.response = new HttpResponse(header + '\r\n\r\n' + file.data);
		return this;
	};

	exports[Klass.name] = Klass;
})(this);
