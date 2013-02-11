/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function Header () {
		this.fields = {};
		this.text = '';
	};
	var prop = Klass.prototype;

	prop.parse = function () {};
	// TODO: Array headers(ex. set-cookie)
	prop.parseFields = function (fields) {
		var result = {};
		fields.forEach(function (field) {
			var match = field.match(/^(.+?)\s*:\s*(.+)/);
			if (!match) {
				return;
			}
			result[match[1].toLowerCase()] = match[2];
		});
		return result;
	};
	prop.get = function (key) {
		return this.fields[key];
	};
	prop.getText = function () {
		return this.text || this.createText();
	};
	prop.createText = function () {
		var headers = [];
		Object.keys(this.fields).forEach(function (key) {
			headers.push(key + ': ' + this.fields[key]);
		}.bind(this));
		this.text = this.getLine() + '\r\n' + headers.join('\r\n');
		return this.text;
	};
	prop.getLine = function () {};
	prop.set = function (key, val) {
		this.fields[key.toLowerCase()] = val;
		delete this.text;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function RequestHeader () {
		this.method = '';
		this.uri = '';
		this.version = '';
	};
	Klass.inherit(Header);
	var prop = Klass.prototype;

	prop.parse = function (text) {
		this.text = text;
		var lines = text.split(/\r?\n/);
		var first = lines.shift();
		this.fields = this.parseFields(lines);
		var param = first.split(/\s+/);
		this.method = param[0];
		this.uri = param[1];
		this.version = param[2];
		return this;
	};
	prop.getMethod = function () {
		return this.method;
	};
	prop.getURI = prop.getURL = function () {
		var uri = this.uri;
		if (uri.match(/^\//)) {
			uri = 'http://' + this.get('host') + this.uri;
		}
		return uri;
	};
	prop.getLine = function () {
		return [this.method, this.uri, this.version].join(' ');
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseHeader () {
		this.version = '';
		this.status = '';
		this.message = '';
	};
	Klass.inherit(Header);
	var prop = Klass.prototype;

	prop.parse = function (text) {
		this.text = text;
		var lines = text.split(/\r?\n/);
		var first = lines.shift();
		this.fields = this.parseFields(lines);
		var param = first.split(/\s+/);
		this.version = param[0];
		this.status = param[1];
		this.message = param[2];
		return this;
	};
	prop.getLine = function () {
		return [this.version, this.status, this.message].join(' ');
	};

	exports[Klass.name] = Klass;
})(this);
