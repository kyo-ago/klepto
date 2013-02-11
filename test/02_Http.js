/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

describe('HttpRequest', function () {
	describe('base', function () {
		it('exist', function () {
			expect(HttpRequest).to.be.an('Function');
		});
	});
	describe('instance', function () {
		it('parse', function () {
			var text = [
				'GET / HTTP/1.1',
				'Host: www.example.com',
				'Connection: keep-alive',
				'User-Agent: Chrome'
			].join('\r\n');
			var http = new HttpRequest(text + '\r\n\r\n');
			expect(http.getHeader('host')).to.eql('www.example.com');
			expect(http.getHeaderText()).to.eql(text);
			expect(http.getText()).to.eql(text + '\r\n\r\n');
			expect(http.isComplete()).to.eql(true);
			expect(http.getURL()).to.eql('http://www.example.com/');
		});
	});
});

describe('HttpResponse', function () {
	describe('base', function () {
		it('exist', function () {
			expect(HttpResponse).to.be.an('Function');
		});
	});
	describe('instance', function () {
		it('parse', function () {
			var text = [
				'HTTP/1.1 200 OK',
				'Content-Encoding: gzip',
				'Content-Type: text/html; charset=UTF-8',
				'Content-Length: 1',
				'Date: Mon, 11 Feb 2013 09:32:38 GMT',
				'Connection: close'
			].join('\r\n');
			var body = '\r\n\r\n' + '1';
			var http = new HttpRequest(text + body);
			expect(http.getHeader('connection')).to.eql('close');
			expect(http.getHeader('content-length')).to.eql('1');
			expect(http.getHeaderText()).to.eql(text);
			expect(http.getText()).to.eql(text + body);
			expect(http.isComplete()).to.eql(true);
		});
	});
});
