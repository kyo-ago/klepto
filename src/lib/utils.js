/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

var utils = {};
utils.ab2t = function (buffer) {
	var array = new Int8Array(buffer);
	var result = '';
	for(var i = 0, l = array.length; i < l; ++i) {
		result += String.fromCharCode.call(this, array[i]);
	}
	return result;
};
utils.t2ab = function (string) {
	var result = new ArrayBuffer(string.length);
	var view = new DataView(result);
	for(var i = 0, l = string.length; i < l; i++) {
		view.setInt8(i, string.charAt(i).charCodeAt());
	}
	return result;
};
utils.t2u8 = function (string) {
	var array = new Uint8Array(string.length);
	for (var i = 0, l = string.length; i < l; ++i) {
		array[i] = string.charCodeAt(i);
	}
	return array;
};
utils.u82t = function (array) {
	var result = '';
	for (var i = 0, l = array.length; i < l; ++i) {
		result = result + String.fromCharCode(array[i]);
	}
	return result;
};
utils.extend = function () {
	var args = Array.prototype.slice.call(arguments);
	var result = {};
	for (var i = 0, l = args.length; i < l; ++i) {
		var arg = args[i];
		if (!arg || 'object' !== typeof arg) {
			continue;
		}
		var keys = Object.keys(arg);
		for (var k = 0, j = keys.length; k < j; ++k) {
			var key = keys[k];
			result[key] = arg[key];
		}
	}
	return result;
};
utils.storage = {};
utils.saveStorage = function (callback) {
	chrome.storage.local.set(this.storage, function() {
		if (chrome.runtime.lastError) {
			alert(chrome.extension.lastError);
		}
		callback && callback();
	}.bind(this));
};
utils.loadStorage = function (callback) {
	chrome.storage.local.get(function(storage) {
		if (chrome.runtime.lastError) {
			alert(chrome.extension.lastError);
		}
		this.storage = storage || {};
		callback && callback();
	}.bind(this));
};

Filer.prototype.dir = function (entry, callback, result) {
	var self = this;
	result = result || {};

	var defer = Deferred();
	this.ls(entry, function (entries) {
		defer.call(entries);
	});
	defer.next(function (entries) {
		var defer = Deferred();
		Deferred.parallel(entries.filter(function (entry) {
			result[entry.fullPath] = entry;
			return entry.isDirectory;
		}).map(function (entry) {
			var defer = Deferred();
			self.dir(entry, defer.call.bind(defer), result);
			return defer;
		})).next(defer.call.bind(defer));
		return defer;
	}).next(function () {
		callback.call(self, result);
	});
};
