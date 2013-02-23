/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var autoResponder = function ($scope) {
	$scope.rules = $scope.rules || [];
	$scope.refresh_interval = 10000;
	appEvents.addListener('backgroundLoad', function (key, rules) {
		if (key !== 'autoResponderRules') {
			return;
		}
		Deferred.parallel(rules.map(function (rule) {
			var isDir = rule.constructor.name === ResponseDirectory.name;
			var klass = isDir ? ResponseDirectory : ResponseFile;
			var instance = new klass(rule.entry);
			return instance.copy(rule).load();
		})).next($scope.applyRules);
	});
	$scope.interval = setInterval(function () {
		$scope.rules.forEach(function (rule) {
			rule.refresh && rule.refresh();
		});
	}, $scope.refresh_interval);
	autoResponder_ui($scope);
	autoResponder_forwarder($scope);
};

function autoResponder_ui ($scope) {
	$scope.selectRule = function (target) {
		$scope.rules.forEach(function (rule) {
			rule.selected = target === rule;
		});
	};
	$scope.addRule = function (klass_name) {
		var path = $scope.response_path;
		var text = $scope.response_value;
		$scope.response_path = '';
		$scope.response_value = '';
		var instance = new window[klass_name](path, text);
		$scope.applyRules([instance]);
		$scope.selectForm = 'ruleTable';
	};
	$scope.unselected = function () {
		$scope.$$phase ? exec() : $scope.$apply(exec);
		function exec () {
			$scope.rules.forEach(function (rule) {
				rule.selected = false;
			});
		}
	};
	$scope.$on('hidden', $scope.unselected);
	$scope.$on('click', $scope.unselected);
	$scope.$on('keyup', function (ang, evn) {
		if ($scope.selectForm !== 'ruleTable') {
			return;
		}
		// 46 === delete key
		if (evn.keyCode !== 46) {
			return;
		}
		if ($(document.activeElement).is(':input')) {
			return;
		}
		$scope.$$phase ? exec() : $scope.$apply(exec);
		function exec () {
			$scope.rules.filter(function (rule) {
				return rule.selected;
			}).forEach(function (rule) {
				var idx = $scope.rules.indexOf(rule);
				$scope.rules.splice(idx, 1);
			});
		}
	});

	$scope.inportDnDFiles = function (entries) {
		$scope.selectForm = 'ruleTable';
		Deferred.parallel(entries.map(function (entry) {
			var klass = entry.isDirectory ? ResponseDirectory : ResponseFile;
			return (new klass()).load(entry);
		})).next($scope.applyRules);
	};
	$scope.applyRules = function (rules) {
		$scope.$$phase ? exec() : $scope.$apply(exec);
		function exec () {
			$scope.rules = $scope.rules.concat(rules);
			appEvents.emitEvent('backgroundSave', [
				'autoResponderRules',
				$scope.rules
			]);
		}
	};
}
function autoResponder_forwarder ($scope) {
	$scope.responseRequest = function (forwarder) {
		var fwd = forwarder;
		if (!ResponseCommand.isMatch(fwd)) {
			$scope.replaceContent(fwd, 'responseRequest');
			return;
		}
		fwd.clearTimeout();
		$scope.commandConnect(fwd);
	};
	$scope.userFilter = function (forwarder) {
		$scope.replaceContent(forwarder, 'userFilter');
	};
	$scope.replaceContent = function (forwarder, type) {
		var fwd = forwarder;
		var path = fwd.location.pathname;
		$scope.rules.some(function (rule) {
			var enable = rule.isEnabled(type);
			return enable && rule.isMatch(path, function (match) {
				fwd.stop();
				rule.replaceContent(match, fwd)
					.next(fwd.setResponse.bind(fwd))
					.next(fwd.switching.bind(fwd, 'browserWrite'))
				;
			});
		});
	};
	$scope.commandConnect = function (forwarder) {
		var fwd = forwarder;
		fwd.stop();
		var cmd = new ResponseCommand();
		cmd.addListener('save', function (file) {
			$scope.rules.some(function (rule) {
				var enable = rule.isEnabled('responseRequest') && rule.saveData;
				return enable && rule.isMatch(file.path, function (match) {
					rule.saveData(file.data, match).next(cmd.sendMessage.bind(cmd, 'saveFile'));
				});
			});
		}.bind(this));
		cmd.response(fwd)
			.next(fwd.setResponse.bind(fwd))
			.next(fwd.browserWrite.bind(fwd, cmd.connect.bind(cmd, fwd)))
		;
	};
}
