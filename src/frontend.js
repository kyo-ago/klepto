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

(function () {
	$(window)
		.on('dragenter dragover', false)
		.on('drop', function (evn) {
			var dt = evn.originalEvent.dataTransfer;
			if (!dt.items.length) {
				return;
			}
			evn.preventDefault();
			Deferred.parallel(
				[].slice.apply(dt.items).map(function (item) {
					return function () {
						var defer = Deferred();
						make_FileReader(item, defer.call.bind(defer));
						return defer;
					};
				})
			).next(result_FileReader);
		})
	;
	function make_FileReader (item, callback) {
		var entry = item.getAsEntry ? item.getAsEntry() : item.webkitGetAsEntry();
		Deferred.parallel({
			'entry' : function () {
				if (entry.isDirectory) {
					return entry;
				}
				var defer = Deferred();
				entry.file(function(entry) {
					defer.call(entry);
				});
				return defer;
			},
			'path' : function () {
				if (entry.isDirectory) {
					return entry.fullPath;
				}
				var defer = Deferred();
				chrome.fileSystem.getDisplayPath(entry, function(path) {
					defer.call(path);
				});
				return defer;
			}
		}).next(callback);
	}
	function result_FileReader (res) {
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
			$autoResponder.responseRequest(this);
		}.bind(forwarder)).addListener('done', function () {
			$networkList.addLog(this);
		}.bind(forwarder));
	}).start();
	window.windowClose = SocketTable.allDestroy.bind(SocketTable);
});

var filer = new Filer();
filer.init();

angular.module('ng').run(function () {
	utils.loadStorage();
}).controller('networkListCtrl', ['$scope', function($scope) {
	$scope.log = {};
	$scope.logs = [];

	$scope.addLog = function (log) {
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
		$('#inspector textarea').prop('scrollTop', 0);
	};
}]).controller('autoResponderCtrl', ['$scope', function($scope) {
	$scope.rules = [];

	$scope.addRule = function () {
	};

	$scope.inportDnDFiles = function (entries) {
		$scope.$apply(function () {
			$scope.rules = $scope.rules.concat(entries.map(function (entry) {
				var matcher = entry.path.match(/.*([\\\/].+?)$/) || [];
				return {
					'enable' : true,
					'matcher' : matcher.pop().replace(/\\/g, '/'),
					'path' : entry.path,
					'entry' : entry.entry
				};
			}));
		});
	};

	$scope.responseFile = function (rule, forwarder, defer) {
		var path = forwarder.location.pathname;
		//last match?
		if (path.indexOf(rule.matcher) === (path.length - 1)) {
			defer.call(rule.entry);
		} else {
			defer.fail();
		}
	};
	$scope.responseDirectory = function (rule, forwarder, defer) {
		/*
		 * TODO: bug fix
		 * Filesystem APIが非同期で実装されてるので、auto responderで設定されてるルールを上から解釈していってもどのルールに一致するか特定できない
		 * ディレクトリマッピングが一つでも設定されている場合、一回の通信毎に全部のディレクトリの中をシーケンシャルに潜っていって（パラレルで潜ると通信毎にレスポンスが変わる可能性あるから）一致したファイルがないか確認しないといけなくて非常にコスト高そう
		 * 先にファイル一覧持っとくとディレクトリの内容の変化に追従できない。ディレクトリの変更監視で更新を把握してもいいけど、それもそれで速度的に問題ないか不安
		 * */
		var path = forwarder.location.pathname;
		//first match?
 		if (path.match(rule.matcher)) {
			defer.fail();
			 return;
		}
		//replace path
		path = path.replace(rule.matcher, entry.fullPath);
 		(function file_ls (entry, file_defer) {
			filer.ls(entry, function (entrys) {
				Deferred.earlier(entrys.filter(function (entry) {
					return path.match(entry.fullPath);
				}).map(function (entry) {
					return Deferred.next(function () {
						var dir_defer = Deferred();
						if (entry.isFile && path.indexOf(entry.fullPath) === (path.length - 1)) {
							entry.file(function (file) {
								dir_defer.call(file);
							});
						} else {
							file_ls(entry, function (file) {
								dir_defer.call(file);
							});
						}
						return dir_defer;
					});
				})).next(function (file) {
					file_defer.call(file);
				});
			});
		})(rule.entry, function (file) {
			 defer.call(file);
		});
	};
	$scope.responseRequest = function (forwarder) {
		forwarder.stop();
		Deferred.earlier($scope.rules.filter(function (rule) {
			return rule.enable;
		}).map(function (rule) {
			return Deferred.next(function () {
				var defer = Deferred();
				if (!rule.entry.isDirectory) {
					$scope.responseFile(rule, forwarder, defer);
				} else {
					$scope.responseDirectory(rule, forwarder, defer);
				}
				return defer;
			});
		})).next(function (file) {
			forwarder.createResponse({
				'file' : file,
				'callback' : forwarder.switching.bind(forwarder, 'browserWrite')
			});
		});
	};
}]).controller('settingCtrl', ['$scope', function($scope) {	
}]);
