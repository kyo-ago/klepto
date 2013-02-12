/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var settings = function ($scope) {
	$scope.event = new EventEmitter();
	appEvents.addListener('init', function () {
		$scope.$apply(function () {
			var stor = utils.storage.settings;
			Object.keys(stor).forEach(function (key) {
				$scope[key] = stor[key];
			});
		});
	});
	$scope.applySettings = function () {
		var stor = utils.storage.settings;
		var require_restart = false;
		var form = $('#settingsTab form');
		Object.keys(stor).forEach(function (key) {
			var change = form.find('[ng-model="' + key + '"]').attr('data-change');
			if (!require_restart && change === 'restart' && stor[key] !== $scope[key]) {
				require_restart = true;
			}
			stor[key] = $scope[key];
		});
		utils.saveStorage(function () {
			if (require_restart) {
				window.windowReload();
			}
		});
	};
};