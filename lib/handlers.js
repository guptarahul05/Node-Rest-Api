/*
*Request handlers
*/

var _data = require('./data');
var helpers = require('./helpers');
// Define handlers 
var handlers = {};

handlers.users = function (data, callback) {

   var acceptableMethods = ['post', 'get', 'put', 'delete']
   if (acceptableMethods.indexOf(data.method) > -1)
      handlers._users[data.method](data, callback);
   else
      callback(405);
};
// Container 
handlers._users = {};
//  Required data: firstname, lastname, phone, password, tosAgreement
// Optional data:none
// users - post
handlers._users.post = function (data, callback) {
   // Check all fields
   var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
   var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
   var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
   var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
   var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

   if (firstName && lastName && phone && password && tosAgreement) {
      // Make sure user not exist
      _data.read('users', phone, function (err, data) {
         if (err) {
            var hashedPassword = helpers.hash(password);

            // Create user object
            if (hashedPassword) {
               var userObject = {
                  'firstName': firstName,
                  'lastName': lastName,
                  'phone': phone,
                  'hashedPassword': hashedPassword,
                  'tosAgreement': true
               };
               _data.create('users', phone, userObject, function (err) {
                  if (!err) {
                     callback(200);
                  } else {
                     console.log(err);
                     callback(500, { 'Error': 'Could not create new user' });

                  }
               });
            } else {
               callback(500, { 'Error': 'Could not hash user\'s password' });
            }

         } else {
            callback(400, { 'Error': 'User already exist' });
         }
      });
   } else {
      callback(400, { 'Error': 'Missing required fields' });
   }
};

// users - get
// Required phone
// @TODO auth
handlers._users.get = function (data, callback) {
   console.log(data);
   
   //  Check phone no is valid
   var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
   if (phone) {
      // Get the tokens from the headers
      var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
      console.log(token);
      
      // verify token in headers is valid to phone
      handlers._tokens.verfiyToken(token, phone, function (tokenIsValid) {
         if (tokenIsValid) {
            _data.read('users', phone, function (err, data) {
               if (!err && data) {
                  // Remove the hashed password
                  delete data.hashedPassword;
                  callback(200, data);
               } else {
                  callback(400);
               }
            });
         } else {
            callback(403, { 'Error': 'Missing required token in header ot token is invalid' });
         }
      });

   } else {
      callback(400, { 'Error': 'Missing required field' })
   }
};

// users - put
// Required phone
// Option all and at least one must be specified 

handlers._users.put = function (data, callback) {
   // Check required field
   var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
   var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
   var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
   var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

   // Err if phone is invalid

   if (phone) {
      if (firstName || lastName || password) {
         // Get the tokens from the headers
         var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
         handlers._tokens.verfiyToken(token, phone, function (tokenIsValid) {
            if (tokenIsValid) {
               // Lookup for user
               _data.read('users', phone, function (err, userData) {
                  if (!err && userData) {
                     if (firstName) {
                        userData.firstName = firstName;
                     }
                     if (lastName) {
                        userData.lastName = lastName;
                     }
                     if (password) {
                        userData.hashedPassword = helpers.hash(password);
                     }
                     // store to disk
                     _data.update('users', phone, userData, function (err) {
                        if (!err) {
                           callback(200);
                        } else {
                           console.log(err);
                           callback(500, { 'Error': 'Could not update user' });
                        }
                     });
                  }
                  else {
                     callback(400, { 'Error': 'Specified user does not exist.' });
                  }
               });
            } else {
               callback(403, { 'Error': 'Missing required token in header ot token is invalid' });
            }
         });

      } else {
         callback(400, { 'Error': 'Missing field to update' });
      }
   } else {
      callback(400, { 'Error': 'Missing required field' });
   }
};

// users - delete
// Required phone
// @TODO auth
// @TODO cleanup other data files to be associiated
handlers._users.delete = function (data, callback) {
   // check phone number
   var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
   if (phone) {
      var token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verfiyToken(token, phone, function (tokenIsValid) {
         if (tokenIsValid) {
            _data.read('users', phone, function (err, data) {
               if (!err && data) {
                  // Remove the hashed password
                  _data.delete('users', phone, function (err) {
                     if (!err) {
                        callback(200);
                     } else {
                        callback(500, { 'Error': 'Cannot delete specified user' });
                     }
                  });
               } else {
                  callback(400, { 'Error': 'Could not find specified user' });
               }
            });
         } else {
            callback(403, { 'Error': 'Missing required token in header ot token is invalid' });

         }
      });

   } else {
      callback(400, { 'Error': 'Missing required field' })
   }
};

// tokens
handlers.tokens = function (data, callback) {

   var acceptableMethods = ['post', 'get', 'put', 'delete']
   if (acceptableMethods.indexOf(data.method) > -1)
      handlers._tokens[data.method](data, callback);
   else
      callback(405);
};
// Goldmans axe
// container for tokens
handlers._tokens = {};

// Token -post
// Required data:phone and password
handlers._tokens.post = function (data, callback) {
   var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
   var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
   if (phone && password) {

      // Lookup the users who matches
      _data.read('users', phone, function (err, userData) {
         if (!err && userData) {
            // Hash the sent password and compare it with the stored password
            var hashedPassword = helpers.hash(password);
            if (hashedPassword == userData.hashedPassword) {
               // if valid create new token . Set expiration date to 1hr
               var tokenId = helpers.createRandomString(20);
               var expires = Date.now() + 1000 * 60 * 60;
               var tokenObject = {
                  'phone': phone,
                  'id': tokenId,
                  'expires': expires
               }
               // Store the token 
               _data.create('tokens', tokenId, tokenObject, function (err) {
                  if (!err) {
                     callback(200, tokenObject);
                  } else {
                     callback(500, { 'Error': 'Could not create new token' });
                  }
               });
            } else {
               callback(400, { 'Error': 'Password not matched' })
            }
         } else {
            callback(400, { 'Error': 'Coukd not find the specified user' });
         }

      });

   } else {
      callback(400, { 'Error': 'Missing required fields' })
   }
};

// Token -get
// Required data: id
handlers._tokens.get = function (data, callback) {
   var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
   if (id) {
      if (phone && password) {

         // Lookup in fs
         _data.read('tokens', id, function (err, tokenData) {
            if (!err && tokenData) {
               callback(200, tokenData);
            } else {
               callback(400);
            }

         });

      } else {
         callback(400, { 'Error': 'Missing required field' });
      }
   };
};

// Token -put
// Require data: id,extends
handlers._tokens.put = function (data, callback) {
   var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
   var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
   if (id && extend) {

      _data.read('tokens', id, function (err, tokenData) {
         if (!err, tokenData) {
            if (tokenData.expires > Date.now()) {
               tokenData.expires = Date.now() + 1000 * 60 * 60;

               _data.update('tokens', id, tokenData, function (err) {
                  if (!err) {
                     callback(200);
                  } else {
                     callback(500, { 'Error': 'Colud not update token expiration' });
                  }
               });
            } else {
               callback(400, { 'Error': 'Token expired and cannot be extended' });
            }
         } else {
            callback(400, { 'Error': 'Specified token does not exist' });
         }

      });

   } else {
      callback(400, { 'Error': 'Missing required fields' });
   }
};
// Token -delete
// Required Data is id
handlers._tokens.delete = function (data, callback) {
   var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
   if (id) {

      // Lookup tokens
      _data.read('tokens', id, function (err, data) {
         if (!err && data) {
            // Remove the hashed password
            _data.delete('tokens', id, function (err) {
               if (!err) {
                  callback(200);
               } else {
                  callback(500, { 'Error': 'Cannot delete specified user id' });
               }
            });
         } else {
            callback(400, { 'Error': 'Could not find specified token' });
         }

      });

   } else {
      callback(400, { 'Error': 'Missing required field' })
   }
};

// Verify if given token id is currently valid for given user
handlers._tokens.verfiyToken = function (id, phone, callback) {
   console.log(id,phone);
   
   _data.read('tokens', id, function (err, tokenData) {
      console.log(tokenData);
      
      if (!err && tokenData) {
         console.log('Hi',tokenData.expires > Date.now());
         if (tokenData.phone == phone && tokenData.expires > Date.now()) {
            
            
            callback(true);
         } else {
            callback(false);
         }
      } else {
         callback(false);
      }
   });
}
// Ping handler
handlers.ping = function (data, callback) {
   callback(200);
}

// Not found handler
handlers.notFound = function (data, callback) {
   callback(404);
};

module.exports = handlers;
