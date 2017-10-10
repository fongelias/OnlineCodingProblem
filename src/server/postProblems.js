'use strict';

const AWS = require('aws-sdk');
const s3 = createS3();


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
}







//lambda entry point
exports.handler = (event, context, callback) => {
	//Calback to return response to client
	
}

















