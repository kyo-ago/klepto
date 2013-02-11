/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var settings = function ($scope) {
	appEvents.addListener('init', function () {
		$scope.$apply(function () {
			$scope.address = utils.storage.settings.address;
			$scope.port = utils.storage.settings.port;
		});
	});
	$scope.applySettings = function () {
		utils.storage.settings.address = $scope.address;
		utils.storage.settings.port = $scope.port;
		utils.saveStorage(function () {
			window.windowReload();
		});
	};
};