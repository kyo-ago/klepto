/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

(function (exports) {
	'use strict';

	var Klass = function ResponseFilesyStem () {};
	Klass.inherit(ResponseRule);
	var prop = Klass.prototype;

	prop.replaceContent = function (entry) {
		var defer = Deferred();

		FileEntry.file.call(entry, function (file) {
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
	prop.saveData = function (data, entry) {
		var defer = Deferred();

		var message = {
			'message' : 'replaceContent',
			'fullPath' : entry.fullPath
		};
		chrome.fileSystem.getWritableEntry(entry, function (entry) {
			entry.createWriter(function (writer) {
				writer.onwriteend = function () {
					defer.call(message);
				};
				writer.write(new Blob([data.text], {
					'type' : 'text/plain'
				}));
			});
		});

		return defer;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseFile () {
		this.type = 'responseRequest';
		this.enable = true;
	};
	Klass.inherit(ResponseFilesyStem);
	var prop = Klass.prototype;

	prop.load = function (entry) {
		var defer = Deferred();
		this.entry = entry;
		this.matcher = entry.name;
		this.path = entry.fullPath;
		Deferred.next(defer.call.bind(defer, this));
		return defer;
	};
	prop.isMatch = function (path, callback) {
		if (this.isPathMatch(path, this.matcher)) {
			callback(this.entry);
			return true;
		}
		return false;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function ResponseDirectory () {
		this.type = 'responseRequest';
		this.enable = true;
		this.map = {};
	};
	Klass.inherit(ResponseFilesyStem);
	var prop = Klass.prototype;

	prop.load = function (entry) {
		this.entry = entry;
		this.path = this.matcher = entry.fullPath;
		var defer = Deferred();
		filer.dir(this.entry, function (map) {
			this.map = map;
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
				callback(this.map[key]);
				return true;
			}
			return false;
		}.bind(this));
	};

	exports[Klass.name] = Klass;
})(this);