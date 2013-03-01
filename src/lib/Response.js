/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function ResponseRule () {};
	var prop = Klass.prototype;

	prop.load = function () {};
	prop.isEnabled = function (type) {
		return this.enable && this.type === type;
	};
	prop.autoSaveEnable = function () {
		return this.autoSave;
	};
	prop.replaceContent = function () {};
	prop.copy = function (instance) {
		['enable', 'matcher', 'filter', 'entry', 'autoSave', 'autoReload'].forEach(function (key) {
			this[key] = this[key] || instance[key];
		}.bind(this));
		return this;
	};
	prop.isMatch = function () {};
	prop.isPathMatch = function (path, match) {
		return path.lastIndexOf(match) === (path.length - match.length);
	};

	exports[Klass.name] = Klass;
})(this);