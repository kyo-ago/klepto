/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function Http () {
		this.head = {};
		this.body = '';
		this.text = '';
		
	};
	var prop = Klass.prototype;

	prop.parse = function (text) {
		var split = text.split(/\r\n\r\n/);
		var head = (new this.Header).parse(split.shift());
		var body = split.join('\r\n\r\n');
		return {
			'head' : head,
			'body' : body
		};
	};
	prop.getHeader = function (key) {
		return this.head.get(key);
	};
	prop.getText = function () {
		return this.text || this.createText();
	};
	prop.createText = function () {
		this.text = this.head.getText() + '\r\n\r\n' + this.body;
		return this.text;
	};
	prop.isComplete = function () {};
	prop.setBody = function () {};
	prop.setHeader = function (key, val) {
		this.head.set(key, val);
		delete this.text;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function HttpRequest (text) {
		var parse = this.parse(text);
		this.head = parse['head'];
		this.body = parse['body'];
		this.text = text;
	};
	Klass.inherit(Http);
	var prop = Klass.prototype;

	prop.Header = RequestHeader;
	prop.getURL = function () {
		return this.head.getURL();
	};
	prop.isComplete = function () {
		var method = this.head.getMethod().toLowerCase();
		if (method === 'post') {
			var length = this.head.get('content-length') - 0;
			return length <= this.body.length;
		}
		return !!this.text.match('\r\n\r\n');
	};
	prop.setBody = function (text) {
		var method = this.head.getMethod();
		if (method !== 'post') {
			throw new Error('set body to invalid method ' + method);
		}
		this.head.set('content-length', text.length);
		this.body = text;
		delete this.text;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function HttpResponse (text) {
		var parse = this.parse(text);
		this.head = parse['head'];
		this.body = parse['body'];
		this.text = text;
	};
	Klass.inherit(Http);
	var prop = Klass.prototype;

	prop.Header = ResponseHeader;
	prop.isComplete = function () {
		var length = this.head.get('content-length') - 0;
		if (!length) {
			return !!this.text.match('\r\n\r\n');
		}
		return length <= this.body.length;
	};
	prop.setBody = function (text) {
		this.head.set('content-length', text.length);
		this.body = text;
		delete this.text;
	};

	exports[Klass.name] = Klass;
})(this);
