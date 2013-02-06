/**
 * micro-location.js Copyright (c) 2012 cho45 ( www.lowreal.net )
 *
 * https://github.com/cho45/micro-location.js
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
// immutable object, should not assign a value to properties
function Location () { this.init.apply(this, arguments) }
Location.prototype = {
	init : function (protocol, host, hostname, port, pathname, search, hash) {
		this.protocol  = protocol;
		this.host      = host;
		this.hostname  = hostname;
		this.port      = port || "";
		this.pathname  = pathname || "";
		this.search    = search || "";
		this.hash      = hash || "";
		if (protocol) {
			with (this) this.href = protocol + '//' + host + pathname + search + hash;
		} else
		if (host) {
			with (this) this.href = '//' + host + pathname + search + hash;
		} else {
			with (this) this.href = pathname + search + hash;
		}
	},

	params : function (name) {
		if (!this._params) {
			var params = {};

			var pairs = this.search.substring(1).split(/[;&]/);
			for (var i = 0, len = pairs.length; i < len; i++) {
				var pair = pairs[i].split(/=/);
				var key  = decodeURIComponent(pair[0]);
				var val  = decodeURIComponent(pair[1]);

				if (!params[key]) params[key] = [];
				params[key].push(val);
			}

			this._params = params;
		}

		switch (typeof name) {
			case "undefined": return this._params;
			case "object"   : return this.build(name);
		}
		return this._params[name] ? this._params[name][0] : null;
	},

	build : function (params) {
		if (!params) params = this._params;

		var ret = new Location();
		var _search = this.search;
		if (params) {
			var search = [];
			for (var key in params) if (params.hasOwnProperty(key)) {
				var val = params[key];
				switch (typeof val) {
					case "object":
						for (var i = 0, len = val.length; i < len; i++) {
							search.push(encodeURIComponent(key) + '=' + encodeURIComponent(val[i]));
						}
						break;
					default:
						search.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
				}
			}
			_search = '?' + search.join('&');
		}

		with (this) ret.init.apply(ret, [
			protocol,
			host,
			hostname,
			port,
			pathname,
			_search,
			hash
		]);
		return ret;
	}
};
Location.regexp = new RegExp('^(?:(https?:)//(([^:/]+)(:[^/]+)?))?([^#?]*)(\\?[^#]*)?(#.*)?$');
Location.parse = function (string) {
	var matched = string.match(this.regexp);
	var ret = new Location();
	ret.init.apply(ret, matched.slice(1));
	return ret;
};

this.Location = Location;