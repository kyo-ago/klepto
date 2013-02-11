/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function Waterfall () {
		// this is not execute.(overwrite child class)
		this.isStop = false;
	};
	Klass.inherit(EventEmitter);
	var prop = Klass.prototype;

	prop.methods = [];
	prop.start = function () {
		this.addListener('error', function (error) {
			console.debug(arguments);
			debugger;
			this.sockets.removeAll();
			throw new Error(error);
		}.bind(this));
		var methods = this.getMethods();
		this.waterfall(methods);
		return this;
	};
	prop.removeAll = function () {
		this.sockets.removeAll();
		return this;
	};
	prop.getMethods = function (name) {
		if (!name) {
			return this.methods;
		}
		var results;
		this.methods.forEach(function (method, index) {
			if (method.name !== name) {
				return;
			}
			results = this.methods.slice(index);
		}.bind(this));
		return results;
	};
	prop.waterfall = function (methods) {
		this.deferred = Deferred.loop(methods.length, function (num) {
			var isStop = this.isStop;
			this.isStop = false;
			return isStop
				? this.waterfall_stop()
				: this.waterfall_loop(methods[num])
			;
		}.bind(this));
		return this;
	};
	prop.waterfall_loop = function (method) {
		var defer = Deferred();
		this.emitEvent(method.name);
		method.call(this, defer.call.bind(defer));
		return defer;
	};
	prop.waterfall_stop = function () {
		var onerror = Deferred.onerror;
		Deferred.onerror = function () {};
		Deferred.next(function () {
			Deferred.onerror = onerror;
		});
		throw 'stop';
	};
	prop.switching = function (method) {
		var methods = this.getMethods(method);
		this.waterfall(methods);
		return this;
	};
	prop.stop = function () {
		this.isStop = true;
		return this;
	};

	exports[Klass.name] = Klass;
})(this);
