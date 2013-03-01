/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

(function (exports) {
	'use strict';

	var Klass = function WebSocketConnect () {};
	Klass.inherit(EventEmitter);
	var prop = Klass.prototype;

	prop.connect = function (socket) {
		this.socket = socket;
		this.flash();
		return this;
	};
	prop.flash = function () {
		this.buffer = [];
		this.read();
	};
	prop.read = function () {
		chrome.socket.read(this.socket, function (evn) {
			if (!evn.data.byteLength) {
				this.emitEvent('close');
				return;
			}
			var frame = (new WebSocketFrame()).parse(evn.data);
			// connection close
			if (frame.opcode === 0x8) {
				this.close();
				return;
			}
			// ping
			if (frame.opcode === 0x9) {
				this.pong();
				this.flash();
				return;
			}
			// binary frame?
			if (frame.opcode !== 1) {
				this.flash();
				return;
			}
			this.buffer.push(frame);
			if (!frame.fin) {
				this.read();
				return;
			}
			this.fin();
			this.flash();
		}.bind(this));
	};
	prop.fin = function () {
		this.emitEvent('read', [this.getText()]);
	};
	prop.getText = function () {
		return this.buffer.map(function (frame) {
			return frame.text;
		}).join('');
	};
	prop.close = function () {
		var ab = WebSocketFrame.createCloseFrame();
		this.write(ab, this.emitEvent.bind(this, 'close'));
	};
	prop.pong = function () {
		// 0xA === opcode(Pong)
		var ab = WebSocketFrame.createFrame(0xA, this.getText());
		this.write(ab);
	};
	prop.write = function (ab, callback) {
		chrome.socket.write(this.socket, ab, function (evn) {
			if (evn.bytesWritten !== ab.byteLength) {
				throw Klass.name + ' chrome.socket.write';
			}
			callback && callback();
		}.bind(this));
	};
	prop.sendText = function (text) {
		// 0x1 === opcode(Text)
		var ab = WebSocketFrame.createFrame(0x1, text);
		this.write(ab);
	};

	Klass.guid = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
	Klass.getAcceptKey = function (sec_key) {
		var sha1 = new jsSHA(sec_key.trim() + Klass.guid, 'TEXT');
		var base64 = sha1.getHash('SHA-1', 'B64');
		return base64;
	};

	exports[Klass.name] = Klass;
})(this);