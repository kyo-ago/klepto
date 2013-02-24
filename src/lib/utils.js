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
		view.setInt8(i, string.charCodeAt(i));
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
utils.t2bs= function (string) {
	var result = '';
	for (var i = 0, l = string.length; i < l; ++i) {
		result += String.fromCharCode(string.charCodeAt(i) & 0xff);
	}
	return result;
};
utils.decodeUtf8 = function (str) {
	return decodeURIComponent(escape(str));
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
utils.parseQuery = function (strs) {
	var result = {};
	strs.split('&').forEach(function (str) {
		var k_v = str.split('=');
		result[decodeURIComponent(k_v.shift())] = decodeURIComponent(k_v.join('='));
	});
	return result;
};
utils.keyup = function ($scope, param, callback) {
	return function (ang, evn) {
		var notInput = param['notInput'];
		delete param['notInput'];
		var some = Object.keys(param).some(function (key) {
			return param[key] !== evn[key];
		});
		if (some) {
			return;
		}
		if (notInput && $(document.activeElement).is(':input')) {
			return;
		}
		$scope.$$phase ? callback() : $scope.$apply(callback);
	};
};
utils.storage = {};
utils.saveStorage = function () {
	var defer = Deferred();
	chrome.storage.local.set(this.storage, function() {
		if (chrome.runtime.lastError) {
			alert(chrome.extension.lastError);
		}
		defer.call();
	}.bind(this));
	return defer;
};
utils.loadStorage = function () {
	var defer = Deferred();
	chrome.storage.local.get(function(storage) {
		if (chrome.runtime.lastError) {
			alert(chrome.extension.lastError);
		}
		this.storage = storage || {};
		defer.call();
	}.bind(this));
	return defer;
};
