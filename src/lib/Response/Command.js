/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

(function (exports) {
	'use strict';

	var Klass = function ResponseCommand () {
		this.type = 'responseRequest';
		this.file = {};
	};
	Klass.inherit(ResponseRule);
	var prop = Klass.prototype;

	prop.isMatch = function (forwarder) {
		return ~['localhost', '127.0.0.1'].indexOf(forwarder.location.host);
	};
	prop.noReplaceContent = function () {
		var defer = Deferred();
		Deferred.next(defer.call.bind(defer, this.getMessage.bind(this, {
			'message' : 'noReplaceContent'
		})));
		return defer;
	};
	prop.replaceContent = function (message) {
		var defer = Deferred();
		Deferred.next(defer.call.bind(defer, this.getMessage.bind(this, message)));
		return defer;
	};
	prop.getMessage = function (data) {
		return {
			'body' : JSON.stringify({
				'result' : 'ok',
				'data' : data
			}),
			'type' : 'application/json'
		};
	};

	exports[Klass.name] = Klass;
})(this);