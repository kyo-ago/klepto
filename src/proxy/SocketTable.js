/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function SocketTable () {
		this.sockets = {};
	};
	Klass.sockets = {};
	Klass.allDestroy = function () {
		Object.keys(Klass.sockets).forEach(function (sid) {
			chrome.socket.disconnect(sid-0);
			chrome.socket.destroy(sid-0);
		});
		Klass.sockets = {};
	};
	var prop = Klass.prototype;

	prop.add = function (key, val) {
		if (this.sockets[key]) {
			throw new Error('duplicate add ' + key);
		}
		this.sockets[key] = val;
		Klass.sockets[val] = true;
	};
	prop.get = function (key) {
		if (!this.sockets[key]) {
			throw new Error('missing key ' + key);
		}
		return this.sockets[key];
	};
	prop.remove = function (key) {
		var sid = this.sockets[key];
		chrome.socket.disconnect(sid);
		chrome.socket.destroy(sid);
		delete this.sockets[key];
		delete Klass.sockets[sid];
	};
	prop.removeAll = function () {
		Object.keys(this.sockets).forEach(this.remove.bind(this));
	};

	exports[Klass.name] = Klass;
})(this);
