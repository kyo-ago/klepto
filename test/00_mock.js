/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var chrome = {
	'socket' : {
		'disconnect' : sinon.spy(),
		'destroy' : sinon.spy()
	},
	'contextMenus' : {
		'onClicked' : {
			'addListener' : sinon.spy()
		},
		'create' : sinon.spy(function (options) {
			return options.id;
		}),
		'remove' : sinon.spy()
	}
};
