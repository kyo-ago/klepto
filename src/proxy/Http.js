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
		var split = text.split('\r\n\r\n');
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
	prop.getHeaderText = function () {
		return this.head.getText();
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
	prop.getURL = prop.getURI = function () {
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
	prop.getBodyText = function () {
		return this.body;
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
		var trans = (this.head.get('transfer-encoding') || '').toLowerCase();
		if (!length && trans !== 'chunked') {
			return !!this.text.match('\r\n\r\n');
		}
		if (length) {
			return length <= this.body.length;
		}
		// trans === 'chunked'
		return this.checkChunk(this.body);
	};
	prop.getBodyText = function () {
		return this.body;
	};
	prop.checkChunk = function (text) {
		var size = 0;
		do {
			var size = undefined;
			text = text.replace(/^(\w+).*\r\n/, function (all, hit) {
				size = parseInt(hit, 16);
				return '';
			});
			if (isNaN(size)) {
				return false;
			}
			//done
			if (size === 0) {
				//^\r\n$ === no trailer, \r\n\r\n$ === trailer
				return !!text.match(/^\r\n$|\r\n\r\n$/);
			}
			//2 === '\r\n'
			text = text.substring(size + 2);
			if (!text) {
				return false;
			}
		} while (size);
	};
	prop.setBody = function (text) {
		this.head.set('content-length', text.length);
		this.body = text;
		delete this.text;
	};

	exports[Klass.name] = Klass;
})(this);
