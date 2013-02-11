/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

Deferred.onerror = function () {
	console.debug(arguments);
	debugger;
};

var filer = new Filer();
var appEvents = new EventEmitter();
Deferred.parallel([$, filer.init.bind(filer, {}), utils.loadStorage.bind(utils)].map(function (func) {
	var defer = Deferred();
	func(function () {
		defer.call();
	});
	return defer;
})).next(function () {
	$('#menu a').on('click', function () {
		$($(this).attr('href')).show().siblings().hide();
	}).first().click();
	utils.storage = utils.storage || {};
	utils.storage.settings = utils.storage.settings || {
		'address' : '0.0.0.0',
		'port' : 24888
	};

	var $autoResponder = angular.element('#autoResponderTab').scope();
	var $networkList = angular.element('#networkListTab').scope();
	(new Listener({
		'address' : utils.storage.settings.address || '0.0.0.0',
		'port' : (utils.storage.settings.port - 0) || 24888
	})).addListener('startForwarder', function (forwarder) {
		forwarder.addListener('serverRequest', function () {
			$autoResponder.responseRequest(this);
		}.bind(forwarder)).addListener('done', function () {
			$networkList.addLog(this);
		}.bind(forwarder));
	}).start();

	$(window)
		.on('dragenter dragover', false)
		.on('drop', function (evn) {
			var dt = evn.originalEvent.dataTransfer;
			if (!dt.items.length) {
				return;
			}
			evn.preventDefault();
			$('[href="#autoResponderTab"]').click();
			$autoResponder.inportDnDFiles([].slice.apply(dt.items).map(function (item) {
				return item.webkitGetAsEntry();
			}));
		})
	;

	window.windowClose = SocketTable.allDestroy.bind(SocketTable);
}).next(function () {
	appEvents.emitEvent('init');
	var addListener = appEvents.addListener;
	appEvents.addListener = function (evt, listener) {
		if (evt === 'init') {
			listener();
			return this;
		}
		addListener.apply(this, arguments);
	};
});

angular.module('ng')
	.controller('networkListCtrl', ['$scope', networkList])
	.controller('autoResponderCtrl', ['$scope', autoResponder])
	.controller('settingsCtrl', ['$scope', settings])
;
