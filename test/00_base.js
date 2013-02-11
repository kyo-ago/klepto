/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var expect = chai.expect;
var chrome = {
	'socket' : {
		'disconnect' : function () {},
		'destroy' : function () {}
	}
};
