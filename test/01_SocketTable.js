/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

describeKlass(SocketTable, function () {
	describe('instance', function () {
		var sockets = new SocketTable();
		it('add', function () {
			sockets.add('hoge', 1);
			expect(sockets.sockets).to.eql({
				'hoge' : 1
			});
			expect(SocketTable.sockets).to.eql({
				'1' : true
			});
			expect(sockets.add.bind(sockets, 'hoge', 1)).to.throw(Error);
		});
		it('get', function () {
			expect(sockets.get('hoge')).to.eql(1);
			expect(sockets.get.bind(sockets, 'huga')).to.throw(Error);
		});
		it('remove', function () {
			sockets.remove('hoge');
			expect(sockets.sockets).to.eql({});
			expect(SocketTable.sockets).to.eql({});
			expect(sockets.remove.bind(sockets, 'huga')).to.not.throw();
		});
		it('removeAll', function () {
			sockets.add('hoge', 1);
			sockets.removeAll();
			expect(sockets.sockets).to.eql({});
			expect(SocketTable.sockets).to.eql({});
		});
	});
	describe('klass', function () {
		var sockets = new SocketTable();
		it('add', function () {
			sockets.add('hoge', 1);
			expect(SocketTable.sockets).to.eql({
				'1' : true
			});
			SocketTable.allDestroy();
			expect(SocketTable.sockets).to.eql({});
		});
	});
});