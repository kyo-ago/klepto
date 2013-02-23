/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

var appEvents = new EventEmitter();
var sandbox = $('#sandbox').get(0);
Deferred.onerror = function (e) {
	console.debug([e], e.stack);
};
jQuery.event.props.push('dataTransfer');
var filesystem = new FileSystem();

Deferred.parallel(
	[function () {
		var defer = Deferred();
		Deferred.next($.bind($, defer.call.bind(defer)));
		return defer;
	},
	utils.loadStorage.bind(utils),
	filesystem.init.bind(filesystem)
]).next(function () {
	return Deferred.parallel([
		filesystem.makeFileEntry.bind(filesystem),
		filesystem.makeDirectoryEntry.bind(filesystem),
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

	$('#autoResponderTab table').tableSorter({
		'drop' : function (from, to) {
			var rules = $autoResponder.rules;
			var to_elem = rules[to];
			var old = rules.splice(from, 1);
			rules.splice(rules.indexOf(to_elem) + 1, 0, old[0]);
		}
	});

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
