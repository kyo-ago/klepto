/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

describeKlass(WebSocketFrame, function () {
	describe('instance', function () {
		var ws;
		var dv = new DataView(new ArrayBuffer(20));
		beforeEach(function () {
			ws = new WebSocketFrame();
		});
		it('setFrame', function () {
			// 1000 === fin, 0001 === opcode(0x1 === text), 1 === mask, 0000010 === length(2 byte)
			dv.setUint16(0, parseInt('1000000110000010', 2));
			ws.setFrame(new Uint8Array(dv.buffer));
			expect(ws.fin).to.equal(true);
			expect(ws.opcode).to.equal(1);
			expect(ws.length).to.equal(2);
		});
		it('setLength', function () {
			// 1000 === fin, 0001 === opcode(0x1 === text), 1 === mask, 1111110 === length(0x7E byte)
			dv.setUint16(0, parseInt('1000000111111110', 2));
			ws.setFrame(new Uint8Array(dv.buffer));
			dv.setUint16(2, parseInt('1111111011111110', 2));
			expect(ws.setLength(new Uint8Array(dv.buffer))).to.equal(4);
			expect(ws.length).to.equal(0xFEFE);
		});
		it('setLength(too large)', function () {
			// 1000 === fin, 0001 === opcode(0x1 === text), 1 === mask, 1111110 === length(0x7F byte)
			dv.setUint16(0, parseInt('1000000111111111', 2));
			ws.setFrame(new Uint8Array(dv.buffer));
			expect(ws.setLength.bind(ws, new Uint8Array(dv.buffer))).to.throw('too large');
		});
		it('getText', function () {
			// header + 'Hello'(RFC sample)
			var data = [0x81,0x85,0x37,0xfa,0x21,0x3d,0x7f,0x9f,0x4d,0x51,0x58];
			var dv = new DataView(new ArrayBuffer(data.length));
			data.forEach(function (num, idx) {
				dv.setUint8(idx, num);
			});
			ws.parse(dv.buffer);
			expect(ws.text).to.equal('Hello');
		});
		it('createFrame', function () {
			var frame;
			frame = WebSocketFrame.createFrame(1, 'Hello');
			// 2byte === header length
			expect(frame.byteLength).to.equal(7);

			//Array(200).join().length === 199
			frame = WebSocketFrame.createFrame(1, Array(200).join());
			// 4byte === header length(append length)
			expect(frame.byteLength).to.equal(203);

			ws.setFrame(new Uint8Array(frame));
			ws.setLength(new Uint8Array(frame));
			expect(ws.length).to.equal(199);
		});
		it('createCloseFrame', function () {
			var frame = WebSocketFrame.createCloseFrame();
			ws.setFrame(new Uint8Array(frame));
			ws.setLength(new Uint8Array(frame));
			expect(ws.fin).to.equal(true);
			expect(ws.length).to.equal(0);
		});
	});
});

describeKlass(WebSocketConnect, function () {
	describe('klass', function () {
		it('getAcceptKey', function () {
			expect(WebSocketConnect.getAcceptKey('')).to.equal('Kfh9QIsMVZcl6xEPYxPHzW8SZ8w=');
		});
	});
});
