/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var settings = function ($scope) {
	appEvents.addListener('init', function () {
		$scope.$apply(function () {
			var stor = utils.storage.settings;
			Object.keys(stor).forEach(function (key) {
				$scope[key] = stor[key];
			});
			$scope.storage = utils.storage.settings;
		});
	});
	$scope.applySettings = function () {
		utils.saveStorage().next(function () {
			$scope.$apply('save_success="fadeout"');
			setTimeout($scope.$apply.bind($scope, 'save_success=""'), 2000);
			if (!$scope.net_restart) {
				return;
			}
			var $body = angular.element('body').scope();
			$body.networkRestart();
		});
	};
	$scope.portblocking = function () {
		$scope.portblocking_alert = true;
	};
};