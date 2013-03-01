/**
 * forked from: WebSocket on Chrome Socket API
 * https://github.com/Jxck/ChromeWebSocketServer
 * License
 * author: Jxck license: MIT
 *
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function WebSocketFrame () {};
	var prop = Klass.prototype;

	prop.parse = function (data) {
		var u8a = new Uint8Array(data);
		this.setFrame(u8a);
		var offset = this.setLength(u8a);
		this.text = this.getText(offset, data);
		return this;
	};
	prop.setFrame = function (u8a) {
		var first = u8a[0];
		this.fin = !!(first & 0x80);
		this.opcode = first & 0x0F;
		var second = u8a[1];
		this.length = (second & 0x7F);
	};
	prop.setLength = function (u8a) {
		var offset = 2;
		var dv;
		if (this.length === 0x7E) {
			dv = new DataView(new ArrayBuffer(2));
			dv.setUint8(0, u8a[2]);
			dv.setUint8(1, u8a[3]);
			this.length = dv.getUint16(0);
			offset += 2;
		}
		if (this.length === 0x7F) {
			throw 'too large';
		}
		return offset;
	};
	prop.getText = function (offset, data) {
		var dv = new DataView(data);
		var masks = [
			dv.getUint8(offset++),
			dv.getUint8(offset++),
			dv.getUint8(offset++),
			dv.getUint8(offset++)
		];
		var result = '';
		for (var i = offset, l = dv.byteLength, j = 0; i < l; ++i, ++j) {
			result += String.fromCharCode(dv.getUint8(i) ^ masks[(j % 4)|0]);
		}
		return result;
	};

	Klass.createFrame = function (opcode, text) {
		//1000 === fin, mask === 0
		var opbit = ('0000' + (opcode).toString(2)).substr(-4);
		var head = [parseInt('1000' + opbit, 2), text.length];
		var dv;
		if (head[1] > 0x7E) {
			head[1] = 0x7E;
			dv = new DataView(new ArrayBuffer(2));
			dv.setUint16(0, text.length);
			head.push(dv.getUint8(0));
			head.push(dv.getUint8(1));
		}
		return utils.t2ab(utils.u82t(head) + text);
	};
	Klass.createCloseFrame = function () {
		var dv = new DataView(new ArrayBuffer(2));
		// 1000 === fin, 1000 === opcode(0x8 === close)
		dv.setUint8(0, parseInt('10001000', 2));
		// 0 === mask, 0000000 === length(0 byte)
		dv.setUint8(1, parseInt('00000000', 2));
		return dv.buffer;
	};

	exports[Klass.name] = Klass;
})(this);