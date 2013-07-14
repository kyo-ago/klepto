/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var global = this;
Deferred.onerror = function (e) {
	console.debug([e], e.stack);
};
var frontend;
var saveData = {};

var onLaunched = function () {
	if (frontend) {
		frontend.focus();
		return;
	}
	chrome.app.window.create('/html/frontend.html', {
		'id' : 'frontend',
		'defaultWidth' : 500,
		'defaultHeight' : 300,
		'defaultLeft' : 0,
		'defaultTop' : 0,
		'hidden' : true
	}, function(win) {
		frontend = win;
		/* This code does not work.
			frontend.onClosed.addListener(function () {
				frontend.contentWindow.windowClose();
				frontend = undefined;
			});
			frontend.contentWindow.document.addEventListenr('DOMContentLoaded', function () {
				frontend.focus();
				frontend.show();
			});
		 */
		var sockets = {};
		var win_interval = setInterval(function () {
			if (!frontend.contentWindow.closed) {
				return;
			}
			Object.keys(sockets).forEach(function (sid) {
				chrome.socket.disconnect(sid-0);
				chrome.socket.destroy(sid-0);
			});
			var isReload = frontend.toReload;
			frontend = undefined;
			clearInterval(win_interval);
			if (isReload) {
				onLaunched();
			}
		}, 500);
		var dom_interval = setInterval(function () {
			var win = frontend.contentWindow;
			if (!win.appEvents) {
				return;
			}
			win.appEvents.addListener('windowReload', function () {
				frontend.toReload = true;
				frontend.close();
			});
			win.appEvents.addListener('backgroundSave', function (key, val) {
				saveData[key] = val;
			});
			win.appEvents.addListener('init', function () {
				Object.keys(saveData).forEach(function (key) {
					win.appEvents.emitEvent('backgroundLoad', [key, saveData[key]]);
				});
				frontend.show();
			});
			clearInterval(dom_interval);
		});
	});
};
chrome.app.runtime.onLaunched.addListener(onLaunched);

global.networkStart = function () {
	Deferred.next(function () {
		var defer = Deferred();
		chrome.storage.local.get(defer.call.bind(defer));
		return defer;
	}).next(function (storage) {
		global.storage = storage || {'settings' : {}};
		global.storage.settings = global.storage.settings || {};
		global.listener = new Listener({
			'address' : global.storage.settings.address || '127.0.0.1',
			'port' : (global.storage.settings.port - 0) || 8888
		});
		global.listener.addListener('startForwarder', function (forwarder) {
			forwarder
				.addListener('browserRead', frontendListener.bind(this, 'forwarder_browserRead'))
				.addListener('userFilter', frontendListener.bind(this, 'forwarder_userFilter'))
				.addListener('done', frontendListener.bind(this, 'forwarder_done'))
			;
			function frontendListener (name) {
				if (!frontend) {
					return;
				}
				frontend.contentWindow.appEvents.emitEvent(name, [forwarder]);
			}
		}).addListener('portblocking', function () {
			if (!frontend) {
				return;
			}
			frontend.contentWindow.appEvents.emitEvent('listener_portblocking', [global.listener]);
		}).start();
	});
};
global.networkRestart = function () {
	global.listener.stop();
	SocketTable.allDestroy();
	networkStart();
};
global.networkStart();