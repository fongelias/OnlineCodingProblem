'use strict';

const AWS = require('aws-sdk');
const s3 = createS3();
const SNS = new AWS.SNS();


const config = {
	BUCKET: "yetanotherwhatever.io",
	PROBLEM_DIR: "problems/",
	USERTABLE: {
		NAME: "CandidateRegistration",
		LLSINDEX: 'lls-index',
	},
	PROBLEMTABLE: {
		NAME: "ProblemTable",
	},
	TOPIC: {
		CODEUPLOADED: "arn:aws:sns:us-east-1:229763884986:CodeUploaded",
		CODINGPROBLEM: "arn:aws:sns:us-east-1:229763884986:CodingProblem",
	},
}







//lambda entry point
exports.handler = (event, context, callback) => {
	//Calback to return response to client
	const problemRequest = {
		problem: config.PROBLEM_DIR + encodeURI(event.problemName) + ".html", //Should not alter the problem name in any way
		lls: encodeURI(event.lls),
		name: encodeURI(event.firstName) + " " + encodeURI(event.lastName),
	}

	//console.log(event);
	

	generateProblem(problemRequest).then(response => callback(null, response));
}


function generateProblem(problemRequest) {
	console.log("Beginning request for generating a problem for user with lls " + problemRequest.lls);
	let url;

	return findExistingProblems(problemRequest.lls)
		.then(problemArray => {
			for(let i = 0; i < problemArray.length; i++) {
				if(problemArray[i].problemKey == problemRequest.problem) {
					throw "User has a duplicate problem";
				}
			}

			return problemArray;

		}).then(response => copyPage(problemRequest.problem))
		.then(response => {
			url = response.url;
			const user = {
				lls: problemRequest.lls,
				name: problemRequest.name,
			}

			return addProblemPageEntry(user, response.s3ObjKey, response.url);
		}).catch(err => {
			console.log(err);
			return {
				err,
			};
		})
}



	/* --Problem Table reusable functions-- */
	function addProblemPageEntry(user, problemKey, url) {
		console.log("Adding new entry to " + config.PROBLEMTABLE.NAME);

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

					const message = "New problem with problemkey: " + problemKey + " generated for user: " + user.name;
					const subject = user.name + " has just started a problem!";

					notifyCodingProblemSNS(message, subject);
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


	function copyPage(s3ObjKey) {
		const uuid = Math.uuid();
		const destinationKey = "tp/" + uuid + ".html";
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




