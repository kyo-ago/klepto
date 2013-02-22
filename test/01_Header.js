/**
 * @license Klepto proxy
 * Copyright (C) 2013 @kyo_ago https://github.com/kyo-ago/klepto
 * License: GPL
 */

describeKlass(RequestHeader, function () {
	var header = new RequestHeader();
	it('parse', function () {
		var text = [
			'GET / HTTP/1.1',
			'Host: www.example.com',
			'Connection: keep-alive',
			'Cache-Control: max-age=0',
			'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
			'User-Agent: Chrome',
			'Accept-Encoding: gzip,deflate,sdch',
			'Accept-Language: en,ja;q=0.8,en-US;q=0.6',
			'Accept-Charset: Shift_JIS,utf-8;q=0.7,*;q=0.3'
		].join('\r\n');
		header.parse(text);
		expect(header.getMethod()).to.eql('GET');
		expect(header.getURI()).to.eql('http://www.example.com/');
		expect(header.getURI()).to.eql(header.getURL());
		expect(header.get('host')).to.eql('www.example.com');
		expect(header.getText()).to.eql(text);
	});
});

describeKlass(ResponseHeader, function () {
	var header = new ResponseHeader();
	it('parse', function () {
		var text = [
			'HTTP/1.1 200 OK',
			'Date: Mon, 11 Feb 2013 08:31:14 GMT',
			'Server: Apache',
			'Accept-Ranges: bytes',
			'Content-Length: 1',
			'Connection: close',
			'Content-Type: text/html'
		].join('\r\n');
		header.parse(text);
		expect(header.get('server')).to.eql('Apache');
		expect(header.getText()).to.eql(text);
	});
});