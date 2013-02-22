/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

describeKlass(ResponseRule, function () {
	describe('instance', function () {
		var res = new ResponseRule();
		it('isPathMatch', function () {
			expect(res.isPathMatch('/hoge/huga.txt', 'huga.txt')).to.be.true;
			expect(res.isPathMatch('/hoge/huga.txt', 'hoge.txt')).to.be.false;
			expect(res.isPathMatch('/hoge/huga.txt', '/hoge/')).to.be.false;
		});
	});
});

describeKlass(ResponseFile, function () {
});

describeKlass(ResponseDirectory, function () {
	describe('isMatch', function () {
		var res = new ResponseDirectory();
		res.matcher = '/hoge/';
		res.entry = {
			'fullPath' : '/huga/'
		};
		res.map = {
			'/huga/dir' : { 'isDirectory' : true },
			'/huga/huga.txt' : { 'file' : sinon.spy() },
		};
		it('unmatch 1', function () {
			var spy = sinon.spy();
			expect(res.isMatch('/huga/dir', spy)).to.be.false;
			expect(spy.called).to.be.false;
		});
		it('unmatch 2', function () {
			var spy = sinon.spy();
			expect(res.isMatch('/huga/huga.txt', spy)).to.be.false;
			expect(spy.called).to.be.false;
		});
		it('match', function () {
			var spy = sinon.spy();
			expect(res.isMatch('/hoge/huga.txt', spy)).to.be.true;
			expect(spy.called).to.be.true;
		});
	});
});
