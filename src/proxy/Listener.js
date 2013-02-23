/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function Listener (option) {
		this.sockets = new SocketTable();

		this.option = utils.extend({
			'type' : 'tcp',
			'address' : '127.0.0.1',
			'port' : 8888,
			'backlog' : 200,
			'timeout' : 3000
		}, option);
	};
	Klass.inherit(Waterfall);
	var prop = Klass.prototype;

	prop.methods = [
		function listenerCreate (done) {
			chrome.socket.create(this.option.type, function (info) {
				this.sockets.add('listener', info.socketId);
				done();
			}.bind(this));
		},
		function listenerSetNoDelay (done) {
			var sid = this.sockets.get('listener');
			chrome.socket.setNoDelay(sid, true, function () {
				done();
			}.bind(this));
		},
		function listenerListen (done) {
			var sid = this.sockets.get('listener');
			var addr = this.option.address;
			var port = this.option.port;
			var backlog = this.option.backlog;
			chrome.socket.listen(sid, addr, port, backlog, function (resultCode) {
				if (resultCode === -10) {
					this.sockets.removeAll();
					this.emitEvent('portblocking');
					return;
				}
				if (resultCode !== 0) {
					this.emitEvent('error', arguments);
					return;
				}
				done();
			}.bind(this));
		},
		function listenerAccept () {
			if (this.isStop()) {
				return;
			}
			var sid = this.sockets.get('listener');
			chrome.socket.accept(sid, function (info) {
				if (this.isStop()) {
					return;
				}
				if (info.resultCode === -2) {
					return;
				}
				if (info.resultCode !== 0) {
					this.emitEvent('error', arguments);
					return;
				}
				this.listenerAccept();
				var forwarder = new Forwarder({
					'socketId' : info.socketId,
					'timeout' : this.option.timeout
				});
				this.emitEvent('startForwarder', [forwarder]);
				forwarder.start();
			}.bind(this));
		}
	].map(function (method) {
		return prop[method.name] = method;
	});

	exports[Klass.name] = Klass;
})(this);
