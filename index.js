var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var handlers = require('./lib/handlers');
var helpers = require ('./lib/helpers');


var httpServer = http.createServer(function (req, res) {
	unifiedServer(req, res);
});
httpServer.listen(config.httpPort, function () {
	console.log('The server is listening on port:', config.httpPort);
});
var httpsServerOptions = {
	'key': fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
	unifiedServer(req, res);
});
httpsServer.listen(config.httpsPort, function () {
	console.log('The server is listening on port:', config.httpsPort);
});


//  All the Server logic for both http and https

var unifiedServer = function (req, res) {

	// Get the url and parse it 
	var parsedUrl = url.parse(req.url, true);

	// Get the Path
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get query String
	var queryStringObject = parsedUrl.query;

	// Get Http method
	var method = req.method.toLowerCase();

	// Get the header 
	var headers = req.headers;

	// Get the payload
	var decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', function (data) {
		// console.log(data);
		buffer += decoder.write(data);
	});
	req.on('end', function () {
		buffer += decoder.end();

		
		//  Choose the handler 
		var choosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
		//  Construct data object to send to handler
		var data = {
			'trimmedPath': trimmedPath,
			'queryStringObject': queryStringObject,
			'method': method,
			'headers': headers,
			'payload': helpers.parseJsonToObject(buffer),
		};

		
		// Route req to the handler
		choosenHandler(data, function (statusCode, payload) {
			// Use the status code called by the handler, or default to 200
			statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
			// Use the payload
			payload = typeof (payload) == 'object' ? payload : {};

			//  Convert payload to a string
			var payloadString = JSON.stringify(payload);
			// Send the response
			res.setHeader('Content-type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);
			//Log the request path

			console.log('Response payload: ', statusCode, payloadString);
		});
	});
}

// Define a request router
var router = {
	'ping': handlers.ping,
	'users': handlers.users,
	'tokens': handlers.tokens,
}
