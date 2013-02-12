/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var autoResponder = function ($scope) {
	$scope.event = new EventEmitter();
	$scope.rules = $scope.rules || [];
	appEvents.addListener('backgroundLoad', function (key, val) {
		if (key !== 'autoResponderRules') {
			return;
		}
		//TODO: Reactivate file
		$scope.inportDnDFiles(val);
	});

	$scope.addRule = function () {
	};

	$scope.inportDnDFiles = function (entries) {
		Deferred.parallel(entries.map(function (entry) {
			var klass = entry.isDirectory ? ResponseDirectory : ResponseFile;
			return (new klass(entry, filer)).load(function () {
				this.setRule(this.entry);
			});
		})).next($scope.applyRules);
	};
	$scope.applyRules = function (rules) {
		$scope.$apply(function () {
			$scope.rules = $scope.rules.concat(rules);
			var param = ['autoResponderRules', $scope.rules.map(function (rule) {
				return rule.getEntry();
			})];
			appEvents.emitEvent('backgroundSave', param);
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
};