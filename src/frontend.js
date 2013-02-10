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
Deferred.parallel([$, filer.init.bind(filer)]).next(function () {
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
});

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
		Deferred.parallel(entries.map(function (entry) {
			var klass = entry.isDirectory ? ResponseDirectory : ResponseFile;
			return (new klass(entry, filer)).load(function () {
				this.setRule(this.entry);
			});
		})).next(function (rules) {
			$scope.$apply(function () {
				$scope.rules = $scope.rules.concat(rules);
			});
		});
	};

	$scope.responseRequest = function (forwarder) {
		$scope.rules.filter(function (rule) {
			return rule.enable;
		}).some(function (rule) {
			var forw = forwarder;
			return rule.isMatch(forw.location.pathname, function (match) {
				forw.stop();
				rule.readFile(match)
					.next(forw.setResponse.bind(forw))
					.next(forw.switching.bind(forw, 'browserWrite'))
				;
			});
		});
	};
}]).controller('settingCtrl', ['$scope', function($scope) {
}]);
