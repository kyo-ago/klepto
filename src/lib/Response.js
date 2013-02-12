/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

(function (exports) {
	'use strict';

	var Klass = function ResponseRule () {};
	var prop = Klass.prototype;

	prop.load = function () {};
	prop.setRule = function (entry) {
		this.enable = true;
		this.matcher = entry.fullPath;
		this.path = entry.name;
	};
	prop.readFile = function (file) {
		var fr = new FileReader();
		var defer = Deferred();
		fr.onload = function () {
			defer.call({
				'data' : fr.result,
				'type' : file.type
			});
		}.bind(this);
		fr.readAsText(file);
		return defer;
	};
	prop.getEntry = function () {
		return this.entry;
	};
	prop.isMatch = function () {};
	prop.isPathMatch = function (path, match) {
		return path.lastIndexOf(match) === (path.length - match.length);
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseFile (entry, filer) {
		this.entry = entry;
		this.filer = filer;
		this.file = {};
	};
	Klass.inherit(ResponseRule);
	var prop = Klass.prototype;

	prop.load = function (callback) {
		var defer = Deferred();
		this.entry.file(function (file) {
			this.file = file;
			callback && callback.call(this);
			defer.call(this);
		}.bind(this));
		return defer;
	};
	prop.isMatch = function (path, callback) {
		if (this.isPathMatch(path, this.matcher)) {
			callback(this.file);
			return true;
		}
		return false;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseDirectory (entry, filer) {
		this.entry = entry;
		this.filer = filer;
		this.map = {};
	};
	Klass.inherit(ResponseRule);
	var prop = Klass.prototype;

	prop.load = function (callback) {
		var defer = Deferred();
		this.filer.dir(this.entry, function (map) {
			this.map = map;
			callback && callback.call(this);
			defer.call(this);
		}.bind(this));
		return defer;
	};
	prop.isMatch = function (path, callback) {
		if (!path.match(this.matcher)) {
			return false;
		}
		path = path.replace(this.matcher, this.entry.fullPath);
		return Object.keys(this.map).some(function (key) {
			if (this.map[key].isDirectory) {
				return false;
			}
			if (this.isPathMatch(path, key)) {
				this.map[key].file(callback);
				return true;
			}
			return false;
		}.bind(this));
	};

	exports[Klass.name] = Klass;
})(this);
