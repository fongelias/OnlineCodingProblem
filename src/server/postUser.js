'use strict';

const AWS = require('aws-sdk');

const config = {
	USERTABLE: {
		NAME: "CandidateRegistration",
		LLSINDEX: 'lls-index',
	},
	PROBLEMTABLE: {
		NAME: "ProblemTable",
	},
}




//lambda entry point
exports.handler = (event, context, callback) => {
	//const lls = encodeURI(event.params.querystring.lls);

	const registration = {
		firstName: encodeURI(event.first),
		lastName: encodeURI(event.last),
		email: encodeURI(event.email),
		lls: encodeURI(event.lls),
		topic: event.topic,
		updateLls: false,
	}

	console.log(event);
	//encodeURI()
	//Calback to return response to client

}


	/* --Actions-- */
	function validateUser(registration) {
		console.log("Validating user registration for user " + registration.email);

		return findUser(registration)
			.catch(err => {
				//User not found, create a new user
				return addUser(registration);
			});
	}




	/* --DyanmoDB reusable functions-- */
	/* --User Table reusable functions-- */
	function findUser(registration) {
		return findUserByEmail(registration)
			.then(user => findUserByLls(registration))
			.catch(err => { throw err; });
	}


		function findUserByEmail(registration) {
			console.log('Querying registrations by email for ' + registration.email);
			var docClient = new AWS.DynamoDB.DocumentClient();

			var params = {
				TableName: config.USERTABLE,
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
							user.updateLls = false;
							resolve(user);
						} else {
							reject("User " + registration.email + " not found in " + config.USERTABLE);
						}
					}
				});
			});
		}



		function findUserByLls(registration) {
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
						console.error(errMessage + " Error JSON:", JSON.stringify(err));
						reject(errMessage);
					} else {
						if(data.Items.length > 0) {
							//Give them their existing lls in their new registration
						} else {
							const errMessage = "No matching lls";
							console.log(errMessage);
							reject(errMessage);
						}
					}
				});
			});
		}


	function addUser(registration) {
		console.log("Adding new user to " + config.USERTABLE);

		const docClient = new AWS.DynamoDB.DocumentClient();
		const now = new Date();
		const params = {
			TableName: config.USERTABLE,
			Item: {
				"email": registration.email,
				"first": registration.firstName,
				"last": registration.lastName,
				"start-time": now.toLocaleString("en-US", { timeZone: "America/New_York"}),
				"epoch-time": now.getTime(),
				"lls": registration.lls,
				"topic": registration.topic,
				"testsFinished": [],
				"testsOutstanding": [],
				"testsRequired": config.TESTSREQUIRED,
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



	/* --Logging Functions-- */
	function logEmail(recipient, subject, body) {
		console.log("Sending email to: " + recipient);
		console.log("Subject: " + subject);
		console.log("Body: " + body);
	}