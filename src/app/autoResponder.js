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
			var instance = new klass(rule.entry);
			return instance.copy(rule).load();
		})).next($scope.applyRules);
	});
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
};
function autoResponder_forwarder ($scope) {
	$scope.responseCommand = new ResponseCommand();
	$scope.responseRequest = function (forwarder) {
		var forw = forwarder;
		if (!$scope.responseCommand.isMatch(forw)) {
			$scope.replaceContent(forw, 'responseRequest');
			return;
		}
		$scope.execCommand(forw);
	};
	$scope.userFilter = function (forwarder) {
		$scope.replaceContent(forwarder, 'userFilter');
	};
	$scope.replaceContent = function (forwarder, type) {
		var forw = forwarder;
		var path = forw.location.pathname;
		$scope.rules.some(function (rule) {
			var enable = rule.isEnabled(type);
			return enable && rule.isMatch(path, function (match) {
				forw.stop();
				rule.replaceContent(match, forw)
					.next(forw.setResponse.bind(forw))
					.next(forw.switching.bind(forw, 'browserWrite'))
				;
			});
		});
	};
	$scope.execCommand = function (forwarder) {
		var forw = forwarder;
		forw.stop();
		$scope.responseCommand.wsResponse(forw)
			.next(forw.setResponse.bind(forw))
			.next(forw.switching.bind(forw, 'browserWrite'))
		;
	};
};