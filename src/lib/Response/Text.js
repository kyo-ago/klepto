/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function ResponseTextBase () {};
	Klass.inherit(ResponseRule);
	var prop = Klass.prototype;

	prop.load = function (callback) {
		return callback;
	};
	prop.isMatch = function (path, callback) {
		if (this.isPathMatch(path, this.matcher)) {
			callback(this.filter);
			return true;
		}
		return false;
	};
	prop.execFilter = function (filter, param) {
		var defer = Deferred();
		var command = param.command;
		param.type = param.type || 'text/plain';
		window.addEventListener('message', function callback (evn) {
			if (evn.source !== sandbox.contentWindow) {
				return;
			}
			if (evn.data.command !== command) {
				return;
			}
			window.removeEventListener('message', callback);
			defer.call({
				'data' : evn.data.head + '\r\n\r\n' + evn.data.body,
				'type' : evn.data.type
			});
		});
		sandbox.contentWindow.postMessage(param, '*');
		return defer;
	};
	prop.copy = function (instance) {
		['enable', 'matcher', 'path', 'filter'].forEach(function (key) {
			this[key] = this[key] || instance[key];
		}.bind(this));
		return this;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseTemplate (path, text) {
		this.type = 'responseRequest'
		this.enable = true;
		this.path = 'Template';
		this.matcher = path;
		this.filter = text;
	};
	Klass.inherit(ResponseTextBase);
	var prop = Klass.prototype;

	prop.replaceContent = function (filter) {
		var defer = Deferred();
		Deferred.next(defer.call.bind(defer, {
			'body' : filter,
			'type' : 'text/plain'
		}));
		return defer;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseFilter (path, text) {
		this.type = 'userFilter';
		this.enable = true;
		this.path = 'Filter';
		this.matcher = path;
		this.filter = text;
	};
	Klass.inherit(ResponseTextBase);
	var prop = Klass.prototype;

	prop.replaceContent = function (filter, forwarder) {
		return this.execFilter(filter, {
			'command' : 'userFilter',
			'filter' : filter,
			'head' : forwarder.response.getHeaderText(),
			'body' : forwarder.response.getBodyText(),
			'type' : forwarder.response.getHeader('content-type')
		});
	};

	exports[Klass.name] = Klass;
})(this);
