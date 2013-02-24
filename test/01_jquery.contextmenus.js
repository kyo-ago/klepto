/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

describe('jquery.contextmenus', function () {
	describe('contextMenus', function () {
		it('exist', function () {
			expect($.fn.contextMenus).to.be.an('Function');
		});
		it('new', function () {
			expect($('<div>').contextMenus().length).to.eql(1);
		});
	});
	describe('instance', function () {
		var callback_spy = sinon.spy();
		var options = {
			'id' : 'dummy',
			'callback' : function () {
				callback_spy.apply(this, arguments);
			}
		};
		var instance = $('<div>').contextMenus(options);
		beforeEach(function () {
			$.fn.contextMenus.items = [];
		});
		it('init', function () {
			instance.trigger('contextmenu');
			expect($.fn.contextMenus.items).to.eql([{
				'id' : 'dummy',
				'options' : options
			}]);

			instance.trigger('contextmenu');
			expect($.fn.contextMenus.items.length).to.eql(1);
		});
		it('onClicked', function () {
			var event = chrome.contextMenus.onClicked.addListener.args[0][0]

			instance.trigger('contextmenu');
			event({
				'menuItemId' : 'dummy'
			});

			expect(chrome.contextMenus.remove).have.been.calledWith('dummy');
			expect($.fn.contextMenus.items.length).to.eql(0);
			expect(callback_spy.calledOnce).to.be.ok;
		});
	});
});
