/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

var expect = chai.expect;
sinon.log = console.log.bind(console);
Deferred.onerror = function (e) {
	throw e;
};
describeKlass = function (klass, callback) {
	describe(klass.name, function () {
		it('exist', function () {
			expect(klass).to.be.an('Function');
		});
		it('new', function () {
			var instance = new klass();
			expect(instance).to.be.an('Object');
			expect(instance).to.be.an.instanceof(klass);
		});
		callback();
	});
};
