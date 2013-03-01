/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function($) {
	'use strict';

	var Klass = function contextMenus (selector, options) {
		if ('string' !== typeof selector) {
			options = selector;
			selector = undefined;
		}
		if (!$.isArray(options)) {
			options = [options];
		}
		var callback = Klass.callback.bind(this, options);
		if (selector) {
			this.on('contextmenu', selector, callback);
		} else {
			this.on('contextmenu', callback);
		}
		return this;
	};
	Klass.items = [];
	Klass.callback = function (options, event) {
		var filters = options.filter(function (opt) {
			return !opt.filter || opt.filter.call(this, event);
		}.bind(this));
		if (!filters.length) {
			return;
		}
		Klass.removeAll();
		filters.forEach(Klass.register.bind(this, event));
	};
	Klass.register = function (event, opt) {
		var param = Klass.makeParam(opt, [
			'type', 'id', 'title', 'checked', 'contexts',
			'parentId', 'onclick', 'documentUrlPatterns',
			'targetUrlPatterns', 'enabled'
		]);
		var id = chrome.contextMenus.create(param);
		if (opt.callback) {
			opt.callback = opt.callback.bind(this);
		}
		Klass.items.push({
			'id' : id,
			'options' : opt,
			'event' : event
		});
	};
	Klass.makeParam = function (opt, keys) {
		var result = {};
		keys.forEach(function (key) {
			if (key in opt) {
				result[key] = opt[key];
			}
		});
		return result;
	};
	Klass.removeAll = function () {
		Klass.items.forEach(function (item) {
			chrome.contextMenus.remove(item.id);
		});
		Klass.items = [];
	};
	chrome.contextMenus.onClicked.addListener(function (evn) {
		var id = evn.menuItemId;
		var some = Klass.items.some(function (item) {
			return item.id === id;
		});
		if (!some) {
			return;
		}
		chrome.contextMenus.remove(id);
		var filters = Klass.items.filter(function (item) {
			return item.id === id;
		});
		Klass.items = Klass.items.filter(function (item) {
			return item.id !== id;
		});
		if (!filters.length) {
			return;
		}
		filters.forEach(function (filter) {
			if (!filter.options) {
				return;
			}
			if (!filter.options.callback) {
				return;
			}
			filter.options.callback(evn, filter.event);
		});
	});
	document.body.addEventListener('contextmenu', Klass.removeAll, true);

	$.fn[Klass.name] = Klass;
	$[Klass.name] = Klass;
})(jQuery);