'use strict';

const AWS = require('aws-sdk');
const s3 = createS3();
 
const config = {
	SENDER:'"Registration" <noreply@yetanotherwhatever.io>',
	BUCKET: "yetanotherwhatever.io",
	PROBLEM_DIR: "problems/",
	USERTABLE: "CandidateRegistration",
	PROBLEMTABLE: "ProblemTable",
	//AVAIL_PROBS: {},
}

/*const problemkeys = {
	GAKKY: config.PROBLEM_DIR + 'gakky.html',
	SYMCODE: config.PROBLEM_DIR + 'symcode.html',
}

//Configure available problem pages
config.AVAIL_PROBS[problemkeys.GAKKY] = true;
config.AVAIL_PROBS[problemkeys.SYMCODE] = true;*/








//lambda entry point
exports.handler = function (event, context, callback) {

	const registration = {
		firstName: event.first,
		lastName: event.last,
		email: event.email,
		lls: event.lls,
		topic: event.topic,
	}
   	
   	//Callback to return response to client
   	validateRegistration(registration).then(response => callback(null, response));
}



function validateRegistration(registration) {

	return validateUser(registration).then(user => {		

		if(user.testsRequired == user.testsFinished.length) {
			const completionMessage = "You have already completed your interview";
			console.error(completionMessage);


			resolve(success({
				completionMessage,
				redirect: "interviewComplete",
			}));

		} else if(user.testsFinished.length != user.testsOutstanding.length) {
			const existingProblemKey = user.testsOutstanding.reduce((p,c) => {
				return !user.testsFinished.includes(c) ? c : p;
			}, null);
			const completionMessage = "You have an unfinished problem. Resending link to " + user.email;
			console.log(completionMessage);

			resolve(resendExistingProblem(user, existingProblemKey));
		} else {
			const completionMessage = "Generating a new problem, an email will be sent to you at " + user.email;
			console.log(completionMessage);

			resolve(generateNewProblem(user));
		}
	});
}



	/* --User Table Actions-- */
	function validateUser(registration) {
		console.log("Validating user registration for user " + registration.email);

		return findUser(registration)
			.catch(err => {
				//User not found, create a new user
				return addUser(registration);
			});
	}


	/* --Problem Table Actions-- */
	function resendExistingProblem(user, existingProblemKey) {
		console.log("Querying '" + config.PROBLEMTABLE + "'' for existing coding problems");
		const docClient = new AWS.DynamoDB.DocumentClient();
		const params = {
			TableName: config.PROBLEMTABLE,
			KeyConditionExpression: 'lls = :lls AND problemKey = :problemKey',
			ExpressionAttributeValues: {
				":lls": user.lls,
				":problemKey": existingProblemKey,
			},
		}

		return new Promise((resolve, reject) => {
			docClient.query(params, (err, data) => {
				if(err) {
					console.error("Query to Dynamo for resendExistingProblem() failed. Error JSON:", JSON.stringify(err));
					
					resolve(serverError({
						completionMessage: "Your request could not be completed",
					}))
				} else {
					if(data.Items.length > 0) {
						const existingProblemUrl = data.Items[0].url;
						console.log("Query success for resendExistingProblem()");
						emailLinkToCandidate(user.email, existingProblemUrl);

						resolve(success({
							completionMessage: "A link to your coding problem has been sent to your email",
							redirect: existingProblemUrl,
						}));


					} else {
						//If there are no entries, that means that something was deleted that shouldn't be
						console.error("Missing entry in " + config.PROBLEMTABLE + " from resendExistingProblem() query");
						const subject = "LAMBDA WARNING at generateCodingProblem";
						const body = "There is a missing entry in " + config.PROBLEMTABLE + 
							"preventing the user from properly accessing their interview problem";
						tellAndrew(subject, body);
						
						resolve(serverError({
							completionMessage: "Your problem page could not be found",
							redirect: "",
						}));
					}
				}
			});
		});
	}


	function generateNewProblem(user) {
		console.log("Generating a new problem page for user " + user.email);
		let url;

		return selectRandomProblem(user.testsFinished)
			.then(s3ObjKey => copyPage(s3ObjKey))
			.then(response => {
				url = response.url;
				return addProblemPageEntry(user, response.s3ObjKey, response.url)
			})
			.then(response => {
				let updatedUser = Object.assign({}, user);
				updatedUser.testsOutstanding += updatedUser.testsOutstanding.length == 0 ? response.problemKey : ", " + response.problemKey;
				return updateUserTable(updatedUser, "testsOutstanding");
			}).then(response => success({
				completionMessage: "Successfully generated new problem for user",
				redirect: url,
			}))
			.catch(err => serverError(err));
	}


/* --S3 functions-- */
function problemPageList() {
	console.log("Querying s3 for list of problem pages");
	const params = {
		Bucket: config.BUCKET,
		Delimiter: "",
		EncodingType: "url",
		Marker: "",
		MaxKeys: 100,
		Prefix: config.PROBLEM_DIR,
		RequestPayer: 'requester',
	}

	return new Promise((resolve, request) => {

		s3.listObjects(params, (err, data) => {
			if(err) {
				const errMessage = "Error retrieving object list from " + config.BUCKET + " at problemPageList()";
				console.error(errMessage);
				console.error(err, err.stack);
				reject(errMessage);
			} else {
				//Return s3Objs without the parent folder entry
				resolve(data.Contents.slice(1));
			}
		})
	})
}


function selectRandomProblem(testsFinished = []) {
	console.log("Selecting random problem from " + config.BUCKET + config.PROBLEM_DIR);
	
	return problemPageList().then(s3ObjArr => {
		console.log(config.PROBLEM_DIR + " contains " + s3ObjArr.length + " elements");
		

		const selection = availableTests(s3ObjArr, testsFinished);
		let selectedTest;

		
		if(selection.length == 0) {
			const errMessage = "User has completed all available tests, but has not finished the required number of tests";
			console.error(errMessage)
			tellAndrew("LAMBDA ERROR at generateCodingProblem.selectRandomProblem()", "User has completed all available tests, but has not finished the required number of tests")
		} else if (selection.length == 1) {
			selectedTest = selection[0];
			console.log("Only one test available at selectRandomProblem. key: " + selectedTest.Key);
		} else {
			console.log("Selecting a random problem")
			const randIndex = Math.floor(Math.random() * selection.length);
			selectedTest = selection[randIndex];
		}

		
		console.log("Selected" + selectedTest.Key);

		return selectedTest;
	})
}


	function availableTests(s3ObjArr, testsFinished = []) {

		if(!s3ObjArr) {
			throw "s3ObjArr is empty at availableTests()";
		} else {
			let available = testList.map(obj => testsFinished.includes(obj.Key) ? null : obj)
				.filter(val => val != null);

			return available;
		}
	}


function copyPage(s3ObjKey) {
	const uuid = Math.uuid();
	const destinationKey = "tp/" + uuid + ".html";
	const url = "http://" + config.BUCKET + "/" + destKey;
	const params = {
		Bucket: config.BUCKET,
		Key: destinationKey,
		CopySource: encodeURIComponent(config.BUCKET + "/" + s3ObjKey),
		MetadataDirective: "COPY",
	}

	console.log("Copying '" + s3ObjKey + "' to '" + destKey + "'");

	return new Promise((resolve, reject) => {

		s3.copyObject(params, (err, data) => {
			if(err) {
				const errMessage = "Error copying '" + s3ObjKey + "' to '" + destinationKey + "'";
				console.error(errMessage);
				console.error(err, err.stack);

				reject(errMessage);
			} else {
				console.log("Successfully copied '" + s3ObjKey + "' to '" + destKey + "'");
				resolve({
					url,
					s3ObjKey,
				});
			}
		})
	})
}


/* --DyanmoDB reusable functions-- */
/* --User Table reusable functions-- */
function findUser(registration) {
	return findUserByEmail(registration)
		//.then(user => findUserByLls(registration))
		.catch(err => { throw err; });
}


	function findUserByEmail(registration) {
		console.log('Querying registrations by email');
		var docClient = new AWS.DynamoDB.DocumentClient();

		var params = {
			TableName: config.USERTABLE,
			Key: {
				"email": registration.email
			}
		};


		return new Promise((reject, resolve) => {

			docClient.get(params, (err, data) => {
				if(err) {
					const errMessage = "Query to " + config.USERTABLE + " from findUser() has failed.";
					console.error(errMessage + " Error JSON:", JSON.stringify(err));
					reject("Query to dynamoDB not successful")
				} else {
					if(data.Item != null) {
						resolve(data.Item);
					} else {
						reject("User " + registration.email + " not found in " + config.USERTABLE);
					}
				}
			});
		});
	}


	//Removing this part of the registration process for now
	/*function findUserByLls(registration) {
		console.log('Querying registrations by lls');
		var docClient = new AWS.DynamoDB.DocumentClient();

		var params = {
			TableName: config.USERTABLE,
			IndexName: 'lls-index',
			KeyConditionExpression: 'lls = :llskey',
			ExpressionAttributeValues: {
				":llskey": registration.lls,
			},
		}

		return new Promise((reject, resolve) => {

			docClient.query(params, (err, data) => {
				if(err) {
					const errMessage = "Query to " + config.USERTABLE + " from findUserByLls() has failed.";
					console.error( errMessage + " Error JSON:", JSON.stringify(err);
					reject(errMessage);
				} else {
					if(data.Items.length > 0) {
						//Either same user registering with a different email or uuid collision (unlikely)
						//We want to assign them a new lls
					} else {
						const errMessage = "No matching lls";
						console.log(errMessage);
						reject(errMessage);
					}
				}
			})
		})
	}*/


function addUser(registration) {
	console.log("Adding new user to " + config.USERTABLE);

	const docClient = new AWS.DynamoDB.DocumentClient();
	const now = new Date();
	const params = {
		TableName: config.USERTABLE,
		Item: {
			"email": registration.email,
			"first": registration.first,
			"last": registration.last,
			"start-time": now.toLocaleString("America/New_York"),
			"epoch-time": now.getTime(),
			"lls": registration.lls,
			"topic": registration.topic,
		},
	}

	return new Promise((resolve, reject) => {
		docClient.put(params, (err, data) => {
			if(err) {
				const errMessage = "Unable to add user"
				console.error(errMessage + ". Error JSON:", JSON.stringify(err));
				reject(errMessage);
			} else {
				console.log("Added user:", JSON.stringify(data));
				//Put does not return user data
				resolve(params.Item);
			}
		});
	});
}


function updateUserTable(updatedUser, fieldName) {
	console.log("Updating user in " + config.USERTABLE);

	const docClient = new AWS.DynamoDB.DocumentClient();
	const params = {
		TableName: config.USERTABLE,
		Key: { 
			"email": updatedUser.email,
		},
		UpdateExpression: 'set #attr = :newVal',
		ExpressionAttributeNames: {
			"#attr": fieldName,
		},
		ExpressionAttributeValues: {
			":newVal": updatedUser[fieldName],
		},
	}

	return new Promise((resolve, reject) => {
		docClient.update(params, (err, data) => {
			if(err) {
				const errMessage = "Failed to update " + fieldName + " for user " + updatedUser.email + " in " + config.USERTABLE;
				console.err(errMessage);
				reject(errMessage);
			} else {
				console.log("Updated " + fieldName + " for " + updatedUser.email + " to " + updatedUser[fieldName]);
				resolve(updatedUser);
			}
		})
	})
}

/* --Problem Table reusable functions-- */
function addProblemPageEntry(user, problemKey, url) {
	console.log("Adding new entry to " + config.PROBLEMTABLE);

	const docClient = new AWS.DynamoDB.DocumentClient();
	const now = new Date();
	const params = {
		TableName: config.PROBLEMTABLE,
		Item: {
			"lls": user.lls,
			"problemKey": problemKey,
			"url": url,
			"start-time": now.toLocaleString("America/New_York"),
			"epoch-time": now.getTime(),
		},
	}

	return new Promise((resolve, reject) => {
		docClient.put(params, (err, data) => {
			if(err) {
				const errMessage = "Unable to add entry " + url + " to " + config.PROBLEMTABLE;
				console.error(errMessage);
				reject(errMessage);
			} else {
				console.log("Added a new entry for " + url);
				resolve(params.Item);
			}
		})
	})
}



/* --Messaging Functions-- */
function emailLinkToCandidate(email, url) {

	const subject = "Symantec online coding problem";
	const body = "Thank you for your interest in Symantec." + "\n\n" +
		"Here is your unique link to the online coding problem: " + url;
	
	logEmail(email, subject, body);

	var params = {
		Destination: {
			ToAddresses: [
				email,
			],
		},
		Message: {
			Body: {
				Text: {
					Data: body,
					Charset: 'UTF-8',
				},
			},
			Subject: {
				Data: subject,
				Charset: 'UTF-8',
			},
		},
		Source: config.SENDER,
	}



	const ses = new AWS.SES();
	ses.sendEmail(params, (err, data) => {
		if (err) {
			console.error("Error sending coding problem invitiation email to '" + email + "'");
			console.error(err, err.stack);
		} else {
			console.log("Emailed coding problem link to " + email);
		}
	});
}


function tellAndrew(subject, body) {
	const topic = "arn:aws:sns:us-east-1:229763884986:CodingProblem";
	const params = {
		Message: body,
		Subject: subject,
		TopicArn: topic,
	};

	const sns = new AWS.SNS();
	sns.publish(params, (err, data) => {
		if(err) {
			console.error("Error publishing to topic: " + topic);
			console.error(err, err.stack);
		} else {
			console.log("Published message '" + subject + "' to topic: " + topic);
		}
	});
}


/* --Response Object Constructor Functions-- */
function success(bodyObj) {
	return {
		statusCode: '200',
		body: JSON.stringify(bodyObj),
		headers: {
			'Content-Type': 'application/json',
		}
	};
}

function serverError(bodyObj) {
	return {
		statusCode: '500',
		body: JSON.stringify(bodyObj),
		headers: {
			'Content-Type': 'application/json',
		}
	}
}


/* --Logging Functions-- */
function logEmail(recipient, subject, body) {
	console.log("Sending email to: " + recipient);
	console.log("Subject: " + subject);
	console.log("Body: " + body);
}












/* --Libraries-- */
/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
(function() {
  // Private array of chars to use
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  Math.uuid = function (len, radix) {
    var chars = CHARS, uuid = [], i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

  // A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
  // by minimizing calls to random()
  Math.uuidFast = function() {
    var chars = CHARS, uuid = new Array(36), rnd=0, r;
    for (var i = 0; i < 36; i++) {
      if (i==8 || i==13 ||  i==18 || i==23) {
        uuid[i] = '-';
      } else if (i==14) {
        uuid[i] = '4';
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join('');
  };

  // A more compact, but less performant, RFC4122v4 solution:
  Math.uuidCompact = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };
})();







