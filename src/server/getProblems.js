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
	problemPageList().then(response => {
		let problemKeyObj = {}
		response.map(s3Obj => s3Obj.Key).forEach(s3ObjKey => {
			const problemName = s3ObjKey.substring(config.PROBLEM_DIR.length, s3ObjKey.length - ".html".length);
			problemKeyObj[problemName] = s3ObjKey;
		});
		

		callback(null, problemKeyObj)
	});
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


/* --Config Functions-- */
function createS3(regionName) {
    var config = { apiVersion: '2006-03-01' };
    
    if (regionName != null) {
        config.region = regionName;
    }

    var s3 = new AWS.S3(config);
    return s3;
}


