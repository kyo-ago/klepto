/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

Deferred.onerror = function () {
	console.debug(arguments);
};

var filer = new Filer();
var appEvents = new EventEmitter();
var sandbox = $('#sandbox').get(0);
jQuery.event.props.push('dataTransfer');
Deferred.parallel([$, filer.init.bind(filer, {}), utils.loadStorage.bind(utils)].map(function (func) {
	var defer = Deferred();
	func(function () {
		defer.call();
	});
	return defer;
})).next(function () {
	return Deferred.parallel([
		function () {
			var defer = Deferred();
			filer.create('dummy.txt', false, function (fileEntry) {
				window.FileEntry = fileEntry.constructor.prototype;
				defer.call();
			});
			return defer;
		},
		function () {
			var defer = Deferred();
			filer.mkdir('dummy', false, function(dirEntry) {
				window.DirectoryEntry = dirEntry.constructor.prototype;
				window.DirectoryReader = dirEntry.createReader().constructor.prototype;
				defer.call();
			});
			return defer;
		},
		appInitialize
	]);
}).next(function () {
	window.windowClose = SocketTable.allDestroy.bind(SocketTable);
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

function appInitialize () {
	$('#menu a').on('click', function () {
		var elem = angular.element($(this).attr('href'));
		elem.show().siblings().hide().each(function () {
			angular.element(this).scope().event.emitEvent('hidden');
		});
		elem.scope().event.emitEvent('visible');
	}).first().click();
	utils.storage = utils.storage || {};
	utils.storage.settings = utils.extend({
		'address' : '0.0.0.0',
		'port' : 24888,
		'decode_gzip' : true
	}, utils.storage.settings);

	var $autoResponder = angular.element('#autoResponderTab').scope();
	var $networkList = angular.element('#networkListTab').scope();
	(new Listener({
		'address' : utils.storage.settings.address || '0.0.0.0',
		'port' : (utils.storage.settings.port - 0) || 24888
	})).addListener('startForwarder', function (forwarder) {
		forwarder.addListener('browserRead', function () {
			$autoResponder.responseRequest(this);
		}.bind(forwarder)).addListener('userFilter', function () {
			$autoResponder.userFilter(this);
		}.bind(forwarder)).addListener('done', function () {
			$networkList.addLog(this);
		}.bind(forwarder));
	}).start();

	$(window)
		.on('dragenter dragover', false)
		.on('drop', function (evn) {
			var dt = evn.dataTransfer;
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
};

angular.module('ng')
	.controller('networkListCtrl', ['$scope', networkList])
	.controller('autoResponderCtrl', ['$scope', autoResponder])
	.controller('settingsCtrl', ['$scope', settings])
;
