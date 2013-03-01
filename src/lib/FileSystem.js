/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function FileSystem () {
		this.fs = {};
		this.error = this.error.bind(this);
	};
	var prop = Klass.prototype;

	Klass.requestFileSystem = 
		window.requestFileSystem
		||
		window.webkitRequestFileSystem
	;
	prop.init = function () {
		var defer = Deferred();
		var temp = window.TEMPORARY;
		Klass.requestFileSystem.call(window, temp, 1, function (fs) {
			this.fs = fs;
			defer.call();
		}.bind(this), this.error);
		return defer;
	};
	prop.error = function (error) {
		throw error;
	};
	prop.makeFileEntry = function () {
		var defer = Deferred();
		this.fs.root.getFile('dummy.txt', {
			'create' : true,
			'exclusive' : false
		}, function(fileEntry) {
			this.FileEntry = fileEntry;
			defer.call();
		}.bind(this), this.error);
		return defer;
	};
	prop.makeDirectoryEntry = function () {
		var defer = Deferred();
		this.fs.root.getDirectory('dummy', {
			'create' : true,
			'exclusive' : false
		}, function(dirEntry) {
			this.DirectoryEntry = dirEntry.constructor.prototype;
			this.DirectoryReader = dirEntry.createReader().constructor.prototype;
			defer.call();
		}.bind(this), this.error);
		return defer;
	};
	prop.getFile = function (entry) {
		var defer = Deferred();
		this.FileEntry.file.call(entry, defer.call.bind(defer));
		return defer;
	};
	prop.getDirMap = function (entry) {
		return new DirectoryReader({
			'DirectoryEntry' : this.DirectoryEntry,
			'DirectoryReader' : this.DirectoryReader
		}).dir(entry);
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function DirectoryReader (options) {
		this.options = options;
		this.map = {};
	};
	var prop = Klass.prototype;

	prop.dir = function (entry) {
		var defer = Deferred();
		var dir = new DirectoryEntry(this.options);
		dir.lsdir(entry).next(function (entries) {
			Deferred.parallel(entries.filter(function (entry) {
				this.map[entry.fullPath] = entry;
				return entry.isDirectory;
			}.bind(this)).map(function (entry) {
				return this.dir(entry);
			}.bind(this))).next(function () {
				defer.call(this.map);
			}.bind(this));
		}.bind(this));
		return defer;
	};

	exports[Klass.name] = Klass;
})(this);

(function (exports) {
	'use strict';

	var Klass = function DirectoryEntry (options) {
		this.createReader = options.DirectoryEntry.createReader;
		this.readEntries = options.DirectoryReader.readEntries;
		this.map = {};
		this.maxRetry = Klass.maxRetry;
	};
	var prop = Klass.prototype;

	Klass.maxRetry = 3;
	Klass.toArray = Array.prototype.slice;

	prop.lsdir = function (entry) {
		var self = this;
		var defer = Deferred();

		Deferred
			.next(this.getEntries.bind(this, entry))
			.next(this.result.bind(this, defer))
		;

		return defer;
	};
	// http://0-9.tumblr.com/post/42993367868/another-window-object-import
	prop.getEntries = function (entry) {
		var self = this;
		var reader = self.createReader.call(entry);
		var defer = Deferred();
		self.readEntries.call(reader, function (entries) {
			if (!entries.length) {
				return defer.call();
			}
			var result = Klass.toArray.call(entries).filter(function (entry) {
				return !self.map[entry.fullPath];
			}).map(function (entry) {
				self.map[entry.fullPath] = entry;
			});
			if (!result.length) {
				if (self.maxRetry) {
					self.maxRetry--;
				}
				if (!self.maxRetry) {
					return defer.call();
				}
			}
			self.lsdir(entry).next(defer.call.bind(defer));
		});
		return defer;
	};
	prop.result = function (defer) {
		var self = this;
		var result = Object.keys(self.map).sort(function(a, b) {
			return (a.name < b.name
				? -1
				: (b.name < a.name
					? 1
					: 0
				)
			);
		}).map(function (key) {
			return self.map[key];
		});
		defer.call(result);
	};

	exports[Klass.name] = Klass;
})(this);
