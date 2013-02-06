/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function Waterfall () {};
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
		var self = this;
		async.waterfall(methods.map(function (method) {
			return function () {
				var args = [].slice.call(arguments);
				var done = args.pop();
				method.apply(self, args.concat(function () {
					var args = [].slice.apply(arguments);
					self.emitEvent(method.name, args);
					if (!self.isStop) {
						done.apply(self, [null].concat(args));
					}
					self.isStop = false;
				}));
			};
		}));
		return this;
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
