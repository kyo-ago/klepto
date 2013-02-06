/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

'use strict';

(function () {
	$(window)
		.on('dragenter dragover', false)
		.on('drop', function (evn) {
			var dt = evn.originalEvent.dataTransfer;
			if (!dt.items.length) {
				return;
			}
			evn.preventDefault();
			async.parallel(
				[].slice.apply(dt.items).map(function (item) {
					return function (callback) {
						make_FileReader(item, callback);
					};
				}), result_FileReader
			);
		})
	;
	function make_FileReader (item, callback) {
		var file = item.webkitGetAsEntry();
		async.parallel({
			'entry' : function (done) {
				if (file.isFile) {
					file.file(function(entry) {
						done(null, entry);
					});
				} else if (file.isDirectory) {
					
				}
			},
			'path' : function (done) {
				if (file.isFile) {
					chrome.fileSystem.getDisplayPath(file, function(path) {
						done(null, path);
					});
				} else if (file.isDirectory) {
				}
			}
		}, callback);
	}
	function result_FileReader (err, res) {
		$('[href="#autoResponderTab"]').click();
		var $scope = angular.element('#autoResponderTab').scope();
		$scope.inportDnDFiles(res);
	}
})();

$(function () {
	$('#menu a').on('click', function () {
		$($(this).attr('href')).show().siblings().hide();
	}).first().click();

	var $autoResponder = angular.element('#autoResponderTab').scope();
	var $networkList = angular.element('#networkListTab').scope();
	(new Listener({
		'address' : '0.0.0.0',
		'port' : 24888
	})).addListener('startForwarder', function (forwarder) {
		forwarder.addListener('serverRequest', function () {
			$autoResponder.rules.forEach(function (rule) {
				if (!this.location.pathname.match(rule.matcher)) {
					return;
				}
				this.stop();
				this.createResponse({
					'file' : rule.file,
					'callback' : this.switching.bind(this, 'browserWrite')
				});
			}.bind(this));
		}.bind(forwarder)).addListener('done', function () {
			$networkList.addLog(this);
		}.bind(forwarder));
	}).start();
});

window.windowClose = SocketTable.allDestroy.bind(SocketTable);

angular.module('ng').run(function () {
	utils.loadStorage();
}).controller('networkListCtrl', ['$scope', function($scope) {
	$scope.log = {};
	$scope.logs = [];

	$scope.addLog = function (log) {
		if (!log) {
			return;
		}
		$scope.$apply(function() {
			$scope.logs.unshift({
				'id' : $scope.logs.length + 1,
				'url' : log.location.href,
				'log' : log
			});
		});
	};

	$scope.showInspector = function (log) {
		$scope.log = log.log;
		$scope.log.requestText = log.log.request.getText();
		$scope.log.responsetText = log.log.response.getText();
	};
}]).controller('autoResponderCtrl', ['$scope', function($scope) {
	$scope.rules = [];

	$scope.addRule = function () {
	};

	$scope.inportDnDFiles = function (files) {
		$scope.$apply(function () {
			$scope.rules = $scope.rules.concat(files.map(function (file) {
				var matcher = file.path.match(/.+[\\\/](.+?)$/) || [];
				return {
					'enable' : true,
					'matcher' : matcher.pop(),
					'path' : file.path,
					'file' : file
				};
			}));
		});
	};
}]).controller('settingCtrl', ['$scope', function($scope) {	
}]);
