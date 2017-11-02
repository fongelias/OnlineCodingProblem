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
	if(event.params.querystring.lls) {
		const lls = encodeURI(event.params.querystring.lls);

		//Calback to return response to client
		populateUserByLls(lls)
			.then(response => callback(null, response));
	} else {
		callback(null, {
			err: "lls not supplied in query",
			found: false,
		})
	}
}


function populateUserByLls(lls) {
	let user = {
		lls,
	};

	return findUserByLls(lls)
		.then(response => {
			user.firstName = response.first;
			user.lastName = response.last;
			user.email = response.email;
			user.found = true;

			return findExistingProblems(lls);
		}).then(response => {
			user.problems = response;

			return user;
		}).catch(err => { 
			return {
				err,
				found : false,
			};
		});
}


/* --DynamoDB reusable functions-- */
/* --User Table reusable functions-- */
function findUserByLls(lls) {
	console.log('Querying registrations by lls for ' + lls);
	const docClient = new AWS.DynamoDB.DocumentClient();
	const params = {
		TableName: config.USERTABLE.NAME,
		IndexName: config.USERTABLE.LLSINDEX,
		KeyConditionExpression: 'lls = :llskey',
		ExpressionAttributeValues: {
			":llskey" : lls,
		},
	}

	return new Promise((resolve, reject) => {
		docClient.query(params, (err, data) => {
			if(err) {
				const errMessage = "Query to " + config.USERTABLE.NAME + " from findUserByLls() has failed.";
				console.error(errMessage + " Error JSON:" + JSON.stringify(err));
				reject(errMessage);
			} else {
				if(data.Items != null && data.Items.length > 0) {
					resolve(data.Items[0]);
				} else {
					const errMessage = "User " + lls + " not found in " + config.USERTABLE.NAME;
					console.error(errMessage);
					reject(errMessage);
				}
			}
		})
	});
}
/* --Problem Table reusable functions-- */
function findExistingProblems(lls) {
	console.log("Querying '" + config.PROBLEMTABLE.NAME + "'' for existing coding problems");
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


