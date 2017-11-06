'use strict';

const AWS = require('aws-sdk');
const s3 = createS3();
const SNS = new AWS.SNS();



const config = {
	BUCKET: "yetanotherwhatever.io",
	PROBLEM_DIR: "problems/",
	SPA: {
		S3OBJECTKEY: "index.html",
	},
	USERTABLE: {
		NAME: "CandidateRegistration",
		LLSINDEX: 'lls-index',
	},
	PROBLEMTABLE: {
		NAME: "ProblemTable",
	},
	partitionsPerYear: 1,
	SENDER: '"Registration" <noreply@yetanotherwhatever.io>',
	TOPIC: {
		CODEUPLOADED: "arn:aws:sns:us-east-1:229763884986:CodeUploaded",
		CODINGPROBLEM: "arn:aws:sns:us-east-1:229763884986:CodingProblem",
	},
}




//lambda entry point
exports.handler = (event, context, callback) => {

	const registration = {
		firstName: encodeURI(event.firstName),
		lastName: encodeURI(event.lastName),
		email: encodeURI(event.email),
		lls: Math.uuid(),
		topic: event.topic,
	}

	console.log(event);
	console.log(registration);


	//Calback to return response to client
	validateRegistration(registration).then(response => callback(null, response));
}



function validateRegistration(registration) {
	let responseObj = {};
	let userObj;

	return validateUser(registration).then(user => {
		//Save user outside of block for reuse
		userObj = user;
		//Update Response Object
		responseObj.firstName = user.first;
		responseObj.lastName = user.last;
		responseObj.found = true;
		responseObj.lls = user.lls;
		responseObj.updateLls = user.updateLls;

		console.log(user);

		const message = user.first + " " + user.last + " was added with lls " + user.lls + "\n\n\n\n\n\n";
		const subject = user.first + " " + user.last + " just registered on the interview portal";

		notifyCodingProblemSNS(message, subject); 


		return findExistingProblems(user.lls);
	}).then(problemArr => {
		//Update Response Object
		responseObj.problems = problemArr;

		/*
		if(problemArr.length == 0) {

			return generateNewProblem(userObj).then(problem => {
				//Update Response Object
				responseObj.problems.push(problem);
				return responseObj;
			});
		} else {
			return responseObj;
		}*/

		return generateNewDashboard(userObj);
	}).then(response => {
		return responseObj;
	}).catch(err => {
		return {
			err,		
		}
	})
}





	/* --Actions-- */
	function validateUser(registration) {
		console.log("Validating user registration for user " + registration.email);

		return findUserByEmail(registration)
			.catch(err => {

				return findUserByLls(registration).then(response => {
					//User not found, create a new user
					registration.updateLls = response.updateLls;
					registration.lls = response.lls;

					console.log(registration);

					return addUser(registration);
				})
			});
	}


	function generateNewProblem(user) {
		console.log("Generating a new problem page for user " + user.email);
		let url;

		console.log(user);

		return problemPageList(user.lls).then(problemList => {
				//Select first problem in the list since user has not started any
				console.log(problemList);
				return problemList[0];
			}).then(s3Obj => copyPage(s3Obj.Key))
			.then(response => {
				url = response.url;
				return addProblemPageEntry(user, response.s3ObjKey, response.url);
			})
	}



	function generateNewDashboard(user) {
		console.log("Generating a new dashboard page for user " + user.email);
		let url;

		console.log(user);

		return copyPage(config.SPA.S3OBJECTKEY, user.lls, "monthly-tp/").then(response => {
			emailDashboardLinkToCandidate(user.email, response.url)

			return response;
		});

	}




	/* --DyanmoDB reusable functions-- */
	/* --User Table reusable functions-- */
	function findUserByEmail(registration) {
		console.log('Querying registrations by email for ' + registration.email);
		var docClient = new AWS.DynamoDB.DocumentClient();

		var params = {
			TableName: config.USERTABLE.NAME,
			Key: {
				email: registration.email
			}
		};


		return new Promise((resolve, reject) => {

			docClient.get(params, (err, data) => {
				if(err) {
					const errMessage = "Query to " + config.USERTABLE + " from findUser() has failed.";
					console.error(errMessage + " Error JSON:", JSON.stringify(err));
					reject("Query to dynamoDB not successful")
				} else {
					if(data.Item != null) {
						let user = Object.assign({}, data.Item);
						user.updateLls = user.lls != registration.lls;
						resolve(user);
					} else {
						const errMessage = "User " + registration.email + " not found in " + config.USERTABLE.NAME;
						console.error(errMessage);
						reject(errMessage);
					}
				}
			});
		});
	}



	function findUserByLls(registration) {
		console.log('Querying registrations by lls');
		var docClient = new AWS.DynamoDB.DocumentClient();

		var params = {
			TableName: config.USERTABLE.NAME,
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
					console.error(errMessage + " Error JSON:", JSON.stringify(err));
					reject(errMessage);
				} else {
					if(data.Items.length > 0) {
						//Give them their existing lls in their new registration
						reject({
							errMessage: "Matching Lls found under a different email",
							updateLls: true,
							lls: data.Items[0].lls,
						});
					} else {
						const errMessage = "No matching lls";
						console.log(errMessage);
						reject({
							errMessage,
							updateLls: false,
							lls: registration.lls,
						});
					}
				}
			});
		});
	}


	function addUser(registration) {
		console.log("Adding new user to " + config.USERTABLE.NAME);


		const docClient = new AWS.DynamoDB.DocumentClient();
		const now = new Date();
		const params = {
			TableName: config.USERTABLE.NAME,
			Item: {
				"email": registration.email,
				"first": registration.firstName,
				"last": registration.lastName,
				"start-time": now.toLocaleString("en-US", { timeZone: "America/New_York"}),
				"epoch-time": now.getTime(),
				"epoch-part": parseInt("" + now.getFullYear() + (now.getMonth() % config.partitionsPerYear)),
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
					//Put does not return user data, so use params.Item
					let userObj = Object.assign({}, params.Item);
					userObj.updateLls = registration.updateLls;

					resolve(userObj);
				}
			});
		});
	}


	/* --Problem Table reusable functions-- */
	function addProblemPageEntry(user, problemKey, url) {
		console.log("Adding new entry to " + config.PROBLEMTABLE);

		const docClient = new AWS.DynamoDB.DocumentClient();
		const now = new Date();
		const params = {
			TableName: config.PROBLEMTABLE.NAME,
			Item: {
				"lls": user.lls,
				"problemKey": problemKey,
				"url": url,
				"start-time": now.toLocaleString("en-US", { timeZone:"America/New_York" }),
				"epoch-time": now.getTime(),
			},
		}

		return new Promise((resolve, reject) => {
			docClient.put(params, (err, data) => {
				if(err) {
					const errMessage = "Unable to add entry " + url + " to " + config.PROBLEMTABLE;
					console.error(errMessage + " Error JSON:", JSON.stringify(err));
					reject(errMessage);
				} else {
					console.log("Added a new entry for " + url);
					resolve(params.Item);
				}
			})
		})
	}


	/* --S3 functions-- */
	function findExistingProblems(lls) {
		console.log("Querying '" + config.PROBLEMTABLE.NAME + "' for existing coding problems");
		const docClient = new AWS.DynamoDB.DocumentClient();
		const params = {
			TableName: config.PROBLEMTABLE.NAME,
			KeyConditionExpression: 'lls = :lls',
			ExpressionAttributeValues: {
				":lls": lls,
			},
		}


		return new Promise ((resolve, reject) => {
			docClient.query(params, (err, data) => {
				if(err) {
					const errMessage = "Query to " + config.PROBLEMTABLE.NAME + " from findExistingProblems() has failed.";
					console.error(errMessage + " Error JSON:" + JSON.stringify(err));
					reject(errMessage);
				} else {
					if(data.Items) {
						resolve(data.Items);
					} else {
						const errMessage = "No entries found in " + config.PROBLEMTABLE.NAME;
						console.log(errMessage);
						resolve([]);
					}
				}
			})
		})
	}


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

		return new Promise((resolve, reject) => {

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


	function copyPage(s3ObjKey, lls, destinationDirectory = "tp/") {
		const uuid = lls ? lls : Math.uuid();
		const destinationKey = destinationDirectory + uuid + ".html";
		const url = "http://" + config.BUCKET + "/" + destinationKey;
		const params = {
			Bucket: config.BUCKET,
			Key: destinationKey,
			CopySource: encodeURIComponent(config.BUCKET + "/" + s3ObjKey),
			MetadataDirective: "COPY",
		}

		console.log("Copying '" + s3ObjKey + "' to '" + destinationKey + "'");

		return new Promise((resolve, reject) => {

			s3.copyObject(params, (err, data) => {
				if(err) {
					const errMessage = "Error copying '" + s3ObjKey + "' to '" + destinationKey + "'";
					console.error(errMessage);
					console.error(err, err.stack);

					reject(errMessage);
				} else {
					console.log("Successfully copied '" + s3ObjKey + "' to '" + destinationKey + "'");
					resolve({
						url,
						s3ObjKey,
					});
				}
			})
		})
	}


	/* --SNS functions-- */
	function notifyCodingProblemSNS(message, subject) {
		notifySNS(config.TOPIC.CODINGPROBLEM, message, subject);
	}



		function notifySNS(topic, message, subject) {
			console.log("Notifying SNS topic: " + topic);

			const params = {
				Message: message,
				Subject: subject,
				TopicArn: topic,
			}

			SNS.publish(params).send();
		}



/* --Messaging Functions-- */
function emailLinkToCandidate(email, url) {

	const subject = "Symantec online coding problem";
	const body = "Thank you for your interest in Symantec." + "\n\n" +
		"Here is your unique link to the online coding problem: " + url;
	
	emailCandidate(email, url, body, subject);
}


function emailDashboardLinkToCandidate(email, url) {
	const subject = "Symantec online coding problem";
	const body = "Thank you for your interest in Symantec." + "\n\n" +
		"Here is your unique link to your coding problems: " + url;
	
	emailCandidate(email, url, body, subject);
}


function emailCandidate(email, url, body, subject) {
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

	SNS.publish(params, (err, data) => {
		if(err) {
			console.error("Error publishing to topic: " + topic);
			console.error(err, err.stack);
		} else {
			console.log("Published message '" + subject + "' to topic: " + topic);
		}
	});
}



/* --Logging Functions-- */
function logEmail(recipient, subject, body) {
	console.log("Sending email to: " + recipient);
	console.log("Subject: " + subject);
	console.log("Body: " + body);
}



/* --Config Functions-- */
function createS3(regionName) {
    var config = { apiVersion: '2006-03-01' };
    
    if (regionName != null) {
        config.region = regionName;
    }

    var s3 = new AWS.S3(config);
    return s3;
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








