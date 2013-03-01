/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function($) {
	'use strict';

	var Klass = function tableSorter () {};
	var prop = Klass.prototype;

	prop.init = function () {
		this.setEvent();
	};
	prop.setEvent = function () {
		var self = this;
		var event = 'dragstart dragenter dragleave drop dragend';
		self.elements.on(event, function (evn) {
			var type = evn.type;
			var target = $(evn.target);
			if (!target.attr('draggable')) {
				target = target.closest('[draggable]');
			}
			target.removeClass(event).addClass(type);
			self[type] && self[type](target, evn);
		});
	};
	prop.dragstart = function (elem) {
		self.source = elem;
	};
	prop.drop = function (elem) {
		if (elem.is(self.source)) {
			return;
		}
		this.options.drop(self.source.index(), elem.index());
		elem.after(self.source);
	};

	$.fn[Klass.name] = function (options) {
		var instance = new Klass();
		instance.options = $.extend({
		}, options);
		instance.elements = $(this);
		instance.init();
		return this;
	};
})(jQuery);