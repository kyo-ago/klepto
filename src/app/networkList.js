/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var networkList = function ($scope) {
	$scope.event = new EventEmitter();
	$scope.log = {};
	$scope.logs = [];
	$scope.contextmenu_id = undefined;
	var TRUNCATE_CHARACTERS_SIZE = 128;
	var TRUNCATE_TEXT = '*** Klepto: truncated at ' + TRUNCATE_CHARACTERS_SIZE + ' characters. TODO: Right-click to disable truncation. ***';

	$scope.addLog = function (log) {
		$scope.$apply(function() {
			$scope.logs.unshift({
				'id' : $scope.logs.length + 1,
				'url' : log.location.href,
				'log' : log
			});
		});
	};

	$scope.showInspector = function (_log) {
		var log = _log.log;
		$scope.log = log;
		if (log.constructor === Object) {
			return;
		}
		log.requestText = log.request.getText();
		log.responsetText = log.response.getText();
		$('#inspector textarea').prop('scrollTop', 0);
		$scope.setTruncateData();
	};
	$scope.setTruncateData = function () {
		var log = $scope.log;
		if (log.response.getHeader('content-encoding') !== 'gzip') {
			return;
		}
		var body = log.response.getBodyText();
		if (body.length < TRUNCATE_CHARACTERS_SIZE) {
			return;
		}
		log.responsetText = log.response.getHeaderText() + '\r\n\r\n' + body.substring(0, TRUNCATE_CHARACTERS_SIZE) + '\r\n' + TRUNCATE_TEXT;
	};

	$('#networkListTab #inspector #response').on('contextmenu', function () {
		var log = $scope.log;
		if (log.constructor === Object) {
			return;
		}
		if (log.response.getHeader('content-encoding') !== 'gzip') {
			return;
		}
		if ($scope.contextmenu_id) {
			return;
		}
		$scope.contextmenu_id = chrome.contextMenus.create({
			'title' : 'Decode gzip',
			'id' : 'decode_gzip',
			'contexts' : ['editable']
		});
	});
	chrome.contextMenus.onClicked.addListener(function (evn) {
		var log = $scope.log;
		if ($scope.contextmenu_id !== evn.menuItemId) {
			return;
		}
		$scope.removeContextMenus();
		var body = log.response.getBodyText();
		var gunzip = new Zlib.Gunzip(utils.t2u8(body));
		log.responsetText = log.response.getHeaderText() + '\r\n\r\n' + utils.u82t(gunzip.decompress());
		$scope.$apply();
	});
	$scope.removeContextMenus = function () {
		if (!$scope.contextmenu_id) {
			return;
		}
		chrome.contextMenus.remove($scope.contextmenu_id);
		delete $scope.contextmenu_id;
	};
	$scope.event.addListener('hidden', $scope.removeContextMenus);
};