/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var autoResponder = function ($scope) {
	$scope.event = new EventEmitter();
	$scope.rules = $scope.rules || [];
	appEvents.addListener('backgroundLoad', function (key, rules) {
		if (key !== 'autoResponderRules') {
			return;
		}
		Deferred.parallel(rules.map(function (rule) {
			var isDir = rule.constructor.name === ResponseDirectory.name;
			var klass = isDir ? ResponseDirectory : ResponseFile;
			var instance = new klass(rule.entry, filer);
			return instance.copy(rule).load();
		})).next($scope.applyRules);
	});

	$scope.addRule = function () {
	console.debug(this, arguments);
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
			var param = ['autoResponderRules', $scope.rules];
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