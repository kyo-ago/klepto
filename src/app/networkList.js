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
	var TRUNCATE_TEXT = '*** Klepto: truncated at ' + TRUNCATE_CHARACTERS_SIZE + ' characters. ***';

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
		$('#inspector textarea').prop('scrollTop', 0);
		log.requestText = log.request.getText();
		if (log.response.getHeader('content-encoding') !== 'gzip') {
			log.responsetText = utils.decodeUtf8(utils.t2bs(log.response.getText()));
			return;
		}
		$scope.setDecodeData();
	};
	$scope.setDecodeData = function () {
		var log = $scope.log;
		var header = log.response.getHeaderText();
		var body = log.response.getBodyText('clear_chunk');
		var size = TRUNCATE_CHARACTERS_SIZE;
		var gunzip;
		if (!utils.storage.settings.decode_gzip && body.length > size) {
			body = body.substring(0, size) + '\r\n' + TRUNCATE_TEXT
		} else {
			gunzip = new Zlib.Gunzip(utils.t2u8(body));
			body = utils.decodeUtf8(utils.u82t(gunzip.decompress()));
		}
		log.responsetText = header + '\r\n\r\n' + body;
	};

	$('#networkListTab #inspector #response').on('contextmenu', function () {
		var log = $scope.log;
		if (utils.storage.settings.decode_gzip) {
			return;
		}
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
		log.responsetText = log.response.getHeaderText() + '\r\n\r\n' + utils.decodeUtf8(utils.u82t(gunzip.decompress()));
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