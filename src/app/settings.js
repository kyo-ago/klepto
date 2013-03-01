/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var settings = function ($scope) {
	'use strict';

	appEvents.addListener('init', function () {
		$scope.$apply(function () {
			var stor = utils.storage.settings;
			Object.keys(stor).forEach(function (key) {
				$scope[key] = stor[key];
			});
			$scope.storage = utils.extend({}, utils.storage.settings);
		});
	});
	$scope.applySettings = function () {
		utils.storage.settings = utils.extend(utils.storage.settings, $scope.storage);
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
	$scope.$on('commandOpen', function () {
		$scope.$apply('ApiClientStatus="Klepto-extension Connect"');
		$scope.$parent.$apply('hilightTab="settingsTab"');
	});
	$scope.$on('commandClose', function () {
		$scope.$apply('ApiClientStatus=""');
		$scope.$parent.$apply('hilightTab=""');
	});
};