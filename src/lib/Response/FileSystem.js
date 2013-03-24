/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function ResponseFilesyStem () {};
	Klass.inherit(ResponseRule);
	var prop = Klass.prototype;

	prop.replaceContent = function (entry) {
		var defer = Deferred();

		filesystem.getFile(entry).next(function (file) {
			var fr = new FileReader();
			fr.onload = function () {
				defer.call({
					'body' : fr.result,
					'type' : file.type
				});
			};
			fr.readAsText(file);
		}.bind(this));

		return defer;
	};
	prop.load = function () {};
	prop.isMatch = function () {};
	prop.refresh = function () {};

	prop.saveData = function (data, entry) {
		var defer = Deferred();

		chrome.fileSystem.getWritableEntry(entry, function (entry) {
			entry.createWriter(function (writer) {
				writer.onwriteend = function () {
					writer.onwriteend = defer.call.bind(defer, 'saveSuccess');
					writer.truncate(data.length);
				};
				writer.write(new Blob([data], {
					'type' : 'text/plain'
				}));
			});
		});

		return defer;
	};
	prop.copy = function (instance) {
		['enable', 'matcher', 'path', 'entry'].forEach(function (key) {
			this[key] = this[key] || instance[key];
		}.bind(this));
		return this;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseFile () {
		this.type = 'responseRequest';
		this.enable = true;
		this.autoReload = true;
	};
	Klass.inherit(ResponseFilesyStem);
	var prop = Klass.prototype;

	prop.load = function (entry) {
		var defer = Deferred();
		entry = this.entry || entry;
		this.entry = entry;
		this.matcher = entry.name;
		this.path = entry.fullPath;
		filesystem.getFile(this.entry).next(function (file) {
			this.file = file;
			this.lastModifiedDate = +this.file.lastModifiedDate;
			defer.call(this);
		}.bind(this));
		return defer;
	};
	prop.isMatch = function (path, callback) {
		if (this.isPathMatch(path, this.matcher)) {
			callback(this.entry);
			return true;
		}
		return false;
	};
	prop.refresh = function (callback) { callback.call(this); };
	prop.checkUpdate = function (callback) {
		filesystem.getFile(this.entry).next(function (file) {
			this.file = file;
			var result = this.lastModifiedDate !== +this.file.lastModifiedDate;
			this.lastModifiedDate = +this.file.lastModifiedDate;
			callback(result);
		}.bind(this));
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseDirectory () {
		this.type = 'responseRequest';
		this.enable = true;
		this.autoReload = true;
		this.map = {};
		this.lastModifieds = {};
	};
	Klass.inherit(ResponseFilesyStem);
	var prop = Klass.prototype;

	prop.load = function (entry) {
		entry = this.entry || entry;
		this.entry = entry;
		this.path = this.matcher = entry.fullPath;

		var defer = Deferred();
		this.setMap()
			.next(this.setLastModifieds.bind(this))
			.next(defer.call.bind(defer, this))
		;
		return defer;
	};
	prop.refresh = function (callback) {
		this.setMap().next(callback.bind(this));
	};
	prop.checkUpdate = function (callback) {
		this.setLastModifieds().next(callback)
	};
	prop.setMap = function () {
		var defer = Deferred();
		filesystem.getDirMap(this.entry).next(function (map) {
			this.map = map;
			defer.call(this);
		}.bind(this));
		return defer;
	};
	prop.setLastModifieds = function () {
		var defer = Deferred();
		var new_map = {};
		var old_map = this.lastModifieds;
		Deferred.parallel(Object.keys(this.map).filter(function (key) {
			return this.map[key].isFile;
		}.bind(this)).map(function (key) {
			var defer = Deferred();
			var entry = this.map[key];
			filesystem.getFile(entry).next(function (file) {
				defer.call({
					'file' : file,
					'entry' : entry
				});
			});
			return defer;
		}.bind(this))).next(function (results) {
			var res = results.map(function (res) {
				new_map[res.entry.fullPath] = +res.file.lastModifiedDate;
				return new_map[res.entry.fullPath] === old_map[res.entry.fullPath];
			});
			defer.call(res);
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
				callback(this.map[key]);
				return true;
			}
			return false;
		}.bind(this));
	};


	exports[Klass.name] = Klass;
})(this);