/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var autoResponder = function ($scope) {
	'use strict';

	$scope.rules = $scope.rules || [
	/*
		{
			'path' : String,
			'matcher' : String,
			'lastModifiedDate' : Number,
			'entry' : FileEntry,
			'entryId' : String,
			'file' : File,
			'type' : 'ResponseTemplate' || 'ResponseFilter' || 'ResponseFile' || 'ResponseDirectory',
			'autoReload' : Boolean,
			'enable' : Boolean
		}
	*/
	];
	$scope.commands = undefined;
	$scope.refresh_interval = 5000;
	appEvents.addListener('backgroundLoad', function (key, rules) {
		if (key !== 'autoResponderRules') {
			return;
		}
		Deferred.parallel((rules || []).map(function (rule) {
			var isDir = rule.constructor.name === ResponseDirectory.name;
			var klass = isDir ? ResponseDirectory : ResponseFile;
			var instance = new klass(rule.entry);
			return instance.copy(rule).load();
		})).next($scope.applyRules);
	});
	autoResponder_ui($scope);
	autoResponder_forwarder($scope);
	$scope.interval = setInterval($scope.intervalUpdate, $scope.refresh_interval);
};

function autoResponder_ui ($scope) {
	'use strict';

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
	$scope.deleteRule = function (rule) {
		$scope.rules.splice($scope.rules.indexOf(rule), 1);
	};
	$scope.unselected = function () {
		$scope.$$phase ? exec() : $scope.$apply(exec);
		function exec () {
			$scope.rules.forEach(function (rule) {
				rule.selected = false;
			});
		}
	};
	$scope.intervalUpdate = function () {
		Deferred.parallel($scope.rules.map(function (rule) {
			if (!rule.refresh) {
				return;
			}
			var defer = Deferred();
			rule.refresh(function () {
				if (!this.autoReload) {
					return;
				}
				this.checkUpdate(defer.call.bind(defer));
			});
			return defer;
		})).next(function (results) {
			var res = [];
			res = res.concat.apply(res, results);
			if (!~res.indexOf(true)) {
				return;
			}
			$scope.pageReload();
		});
	};
	$scope.$on('hidden', $scope.unselected);
	$scope.$on('hidden',$.contextMenus.removeAll);
	$scope.$on('click', $scope.unselected);
	$scope.$on('keyup', utils.keyup($scope, {
		// 46 === delete key
		'keyCode' : 46,
		'notInput' : true
	}, function () {
		if ($scope.selectForm !== 'ruleTable') {
			return;
		}
		$scope.rules.filter(function (rule) {
			return rule.selected;
		}).forEach(function (rule) {
			var idx = $scope.rules.indexOf(rule);
			$scope.rules.splice(idx, 1);
		});
	}));
	$('#autoResponderTab #rulesTable table').contextMenus('tr', {
		'title' : 'Delete responder(Del)',
		'id' : 'delete_responder',
		'contexts' : ['all'],
		'callback' : function (chevn, jqevn) {
			var target = $(jqevn.currentTarget);
			$scope.$$phase ? exec() : $scope.$apply(exec);
			function exec () {
				$scope.deleteRule($scope.rules[target.index()]);
			}
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
	'use strict';

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
	$scope.saveFile = function (file) {
		$scope.rules.some(function (rule) {
			var enable = rule.saveData;
			enable = enable || rule.isEnabled('responseRequest');
			enable = enable || rule.autoSaveEnable();
			if (!enable) {
				return false;
			}
			return rule.isMatch(file.path, function (match) {
				rule
					.saveData(file.data, match)
					.next(cmd.sendCommand.bind(cmd, 'saveFile'))
				;
			});
		});
	}
	$scope.commandConnect = function (forwarder) {
		var fwd = forwarder;
		fwd.stop();
		var cmd = new ResponseCommand();
		cmd.addListener('save', $scope.saveFile);
		$scope.$emit('commandOpen', cmd);
		cmd.addListener('close' , function () {
			$scope.$emit('commandClose', cmd);
		});
		cmd.response(fwd)
			.next(fwd.setResponse.bind(fwd))
			.next(fwd.browserWrite.bind(fwd, cmd.connect.bind(cmd, fwd)))
		;
	};
	$scope.pageReload = function () {
		$scope.commands.sendCommand('pageReload');
	};
	$scope.$on('commandOpen', function (evn, cmd) {
		$scope.commands = cmd;
	});
	$scope.$on('commandClose', function (evn, cmd) {
	});
}
