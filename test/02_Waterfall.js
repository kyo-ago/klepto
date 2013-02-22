/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

describeKlass(Waterfall, function () {
	describe('instance', function () {
		var waterfall = new Waterfall();
		waterfall.methods = [
			function first (done) {
				done();
			},
			function second (done) {
				done();
			},
			function third (done) {
				done();
			}
		];
		it('getMethods', function () {
			expect(waterfall.getMethods()).to.eql(waterfall.methods);
			expect(waterfall.getMethods('second').length).to.eql(2);
		});
		it('waterfall_stop', function () {
			expect(waterfall.waterfall_stop).to.throw('stop');
		});
		it('waterfall_loop', function (done) {
			var method = sinon.spy(waterfall.methods[0]);
			var event = sinon.spy();
			waterfall.addListener(method.name, event);
			var defer = waterfall.waterfall_loop(method);
			defer.next(function () {
				expect(event.called).to.be.true;
				expect(method.called).to.be.true;
				done();
			});
			expect(defer).to.be.an.instanceof(Deferred);
		});
	});
});
