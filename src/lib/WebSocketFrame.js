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

'use strict';

(function (exports) {
	'use strict';

	var Klass = function WebSocketFrame () {};
	Klass.inherit(EventEmitter);
	var prop = Klass.prototype;

	prop.parse = function (data) {
		this.u8a = new Uint8Array(data);
		this.setFrame();
		if (this.opcode != 1) {
			return this;
		}
		var offset = this.setLength();
		this.text = this.getText(offset, data);
		return this;
	};
	prop.setFrame = function () {
		var firstByte = this.u8a[0];
		this.fin = !!(firstByte & 0x80);
		this.opcode = firstByte & 0x0F;
		var secondByte = this.u8a[1];
		this.length = (secondByte & 0x7F);
	};
	prop.setLength = function () {
		var offset = 2;
		var dv;
		if (this.length === 0x7E) {
			dv = new DataView(new ArrayBuffer(2));
			dv.setUint8(0, this.u8a[2]);
			dv.setUint8(1, this.u8a[3]);
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
			dv.getUint8(offset)
		];
		var result = '';
		for (var i = offset, l = dv.byteLength; i < l; ++i) {
			result += String.fromCharCode(dv.getUint8(i) ^ masks[(i % 4)|0]);
		}
		return result;
	};

	Klass.t2wsab = function (text) {
		var head = [0x81, text.length];
		var dv;
		if (head[1] > 126) {
			head[1] = 126;
			dv = new DataView(new ArrayBuffer(2));
			dv.setUint16(0, text.length);
			head.push(dv.getUint8(0));
			head.push(dv.getUint8(1));
		}
		return utils.t2ab(utils.u82t(head) + text);
	};

	exports[Klass.name] = Klass;
})(this);