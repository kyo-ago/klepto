/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

describeKlass(DirectoryReader, function () {
	before(function () {
		sinon.stub(DirectoryEntry.prototype, 'lsdir', function () {
			var defer = Deferred();
			Deferred.next(defer.call.bind(defer, [
				{
					'fullPath' : '/hoge'
				}
			]));
			return defer;
		});
	});
	var instance;
	beforeEach(function () {
		instance = new DirectoryReader({
			'DirectoryEntry' : {},
			'DirectoryReader' : {}
		});
	});
	after(function () {
		DirectoryEntry.prototype.lsdir.restore();
	});
	it('dir', function (done) {
		instance.dir().next(function (result) {
			expect(result).to.be.an('Object');
			expect(result['/hoge']).to.be.an('Object');
			done();
		});
	});
});

describeKlass(DirectoryEntry.bind(this, {
	'DirectoryEntry' : {},
	'DirectoryReader' : {}
}), function () {
	var instance;
	beforeEach(function () {
		instance = new DirectoryEntry({
			'DirectoryEntry' : {},
			'DirectoryReader' : {}
		});
	});
	it('getEntries', function () {
		instance.createReader = {
			'call' : sinon.spy(function (arg) {
				return arg;
			})
		};
		instance.lsdir = sinon.spy(instance.lsdir);
		instance.readEntries = {
			'call' : sinon.spy(function (arg, callback) {
				callback([
					{
						'fullPath' : '/hoge'
					}
				]);
			})
		};
		instance.getEntries('hoge');

		expect(instance.readEntries.call).have.been.calledWith('hoge');
		expect(instance.map['/hoge']).to.eql({
			'fullPath' : '/hoge'
		});
	});
	it('result', function () {
		var spy = sinon.spy();
		instance.map = {
			'a' : '1',
			'b' : '2',
			'c' : '3'
		};

		instance.result({
			'call' : spy
		});

		expect(spy).have.been.calledWith(['1', '2', '3']);
	});
});
