/*
* Library for storing and editing data
*/

var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');
// Container
var lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');
// Write Data
lib.create = function (dir, file, data, callback) {
	// Open file for writing
	fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function (err, fileDescriptor) {
		if (!err && fileDescriptor) {
			//  Convert data to string
			var stringData = JSON.stringify(data);
			// Write to file
			fs.writeFile(fileDescriptor, stringData, function (err) {
				if (!err) {
					fs.close(fileDescriptor, function (err) {
						if (!err) {
							callback(false);
						} else {
							callback('Error closing new file');
						}
					});
				} else {
					callback('error writing new file')
				}
			});
		} else {
			callback('Could not create new file, it may all ready exists');
		}
	});
};
// Read data from file
lib.read = function (dir, file, callback) {
	fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function (err, data) {
		if (!err && data) {
			var parsedData = helpers.parseJsonToObject(data);
			callback(false, parsedData);
		} else {
			callback(err, data);
		}
	});
};

lib.update = function (dir, file, data, callback) {
	// Open the file for writing
	fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function (err, fileDescriptor) {
		if (!err && fileDescriptor) {
			var stringData = JSON.stringify(data);
			fs.truncate(fileDescriptor, function (err) {
				if (!err) {
					fs.writeFile(fileDescriptor, stringData, function (err) {
						if (!err) {
							fs.close(fileDescriptor, function (err) {
								callback(false);
							});
						} else {
							callback('Error closing file')
						}
					});
				} else {
					callback('error trancating file')
				}
			});
		} else {
			callback('Could not open file to update');
		}
	});
};
// Deleting
lib.delete = function (dir, file, callback) {
	//unlinking the file 
	fs.unlink(lib.baseDir + dir + '/' + file + '.json', function (err) {
		if (!err) {
			callback(false);
		} else {
			callback('Error deleting file');
		}
	});
}












module.exports = lib;