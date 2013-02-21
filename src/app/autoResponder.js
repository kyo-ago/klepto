/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var autoResponder = function ($scope) {
	$scope.event = new EventEmitter();
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
	$scope.changeForm = function (bool) {
		$('#autoResponderTab .addForms [ng-show]').each(function () {
			$scope[$(this).attr('ng-show')] = bool;
		});
	};
	$scope.showForm = function (target) {
		$scope.changeForm(false);
		$scope[target] = true;
		$scope.rulesTable = false;
	};
	$scope.hideForm = function () {
		$scope.changeForm(false);
		$scope.rulesTable = true;
	};
	$scope.addRule = function (name, klass) {
		var forms = $('#autoResponderTab .addForms form');
		var form = forms.filter('[ng-show="' + name + '"]');
		var path = form.find('[type="text"]').val();
		var text = form.find('textarea').val();
		var instance = new klass(path, text);
		$scope.rulesTable = true;
		$scope.changeForm(false);
		$scope.applyRules([instance]);
		Deferred.next(function () {
			forms.find('[type="reset"]').click();
		});
	};
	$scope.addTemplateRule = $scope.addRule.bind($scope, 'addTemplate', ResponseTemplate);
	$scope.addFilterRule = $scope.addRule.bind($scope, 'addFilter', ResponseFilter);

	$scope.inportDnDFiles = function (entries) {
		$scope.hideForm();
		Deferred.parallel(entries.map(function (entry) {
			var klass = entry.isDirectory ? ResponseDirectory : ResponseFile;
			return (new klass()).load(entry);
		})).next($scope.applyRules);
	};
	$scope.applyRules = function (rules) {
		$scope.$$phase ? add_rules() : $scope.$apply(add_rules);
		function add_rules () {
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
