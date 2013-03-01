/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var networkList = function ($scope) {
	'use strict';

	$scope.log = {};
	$scope.logs = [];
	$scope.contextmenu_id = [];
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
	$scope.getLog = function (id) {
		return $scope.logs.filter(function (log) {
			return log.id === id;
		})[0];
	};
	$scope.deleteLog = function (log) {
		if ('number' === typeof log) {
			log = $scope.getLog(log);
		}
		if ($scope.log === log) {
			$scope.log = {};
		}
		$scope.logs = $scope.logs.filter(function (log_) {
			return log_ !== log;
		});
	};
	$scope.clearLog = function () {
		$scope.log = {};
		$scope.logs = [];
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
			log.responsetText = log.response.getText();
			var content_type = log.response.getHeader('content-type');
			if (!(content_type || '').match(/^image/)) {
				log.responsetText = utils.decodeUtf8(utils.t2bs(log.responsetText));
			}
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

	$scope.$on('keyup', utils.keyup($scope, {
		// 46 === X
		'keyCode' : 88,
		'ctrlKey' : true,
		'notInput' : true
	}, function (ang, evn) {
		$scope.clearLog();
	}));
	$('#networkListTab #connectLog table').contextMenus('tr', [
		{
			'title' : 'Delete log',
			'id' : 'delete_log',
			'contexts' : ['page', 'link'],
			'callback' : function (chevn, jqevn) {
				var target = $(jqevn.currentTarget);
				$scope.deleteLog(target.find('td').eq(0).html()|0);
				$scope.$apply();
			}
		},
		{
			'title' : 'Delete all log(X)',
			'id' : 'delete_all_log',
			'contexts' : ['page', 'link'],
			'callback' : function (chevn, jqevn) {
				$scope.clearLog();
				$scope.$apply();
			}
		}
	]);
	$('#networkListTab #inspector #response').contextMenus({
		'title' : 'Decode gzip',
		'id' : 'decode_gzip',
		'contexts' : ['editable'],
		'filter' : function () {
			var log = $scope.log;
			if (utils.storage.settings.decode_gzip) {
				return false;
			}
			if (log.constructor === Object) {
				return false;
			}
			if (log.response.getHeader('content-encoding') !== 'gzip') {
				return false;
			}
			return true;
		},
		'callback' : function () {
			var log = $scope.log;
			var body = log.response.getBodyText();
			var gunzip = new Zlib.Gunzip(utils.t2u8(body));
			log.responsetText = log.response.getHeaderText() + '\r\n\r\n' + utils.decodeUtf8(utils.u82t(gunzip.decompress()));
			$scope.$apply();
		}
	});
	$scope.$on('hidden',$.contextMenus.removeAll);
};