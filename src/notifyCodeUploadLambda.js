console.log("Loading function");
var AWS = require("aws-sdk");
var SNS = new AWS.SNS();


const config = {
    BUCKET: "yetanotherwhatever.io",
    PROBLEM_DIR: "problems/",
    USERTABLE: {
        NAME: "CandidateRegistration",
        LLSINDEX: 'lls-index',
    },
    PROBLEMTABLE: {
        NAME: "ProblemTable",
        FIELDS: {
            COMPLETED: "completed",
        },
    },
}




exports.handler = function(event, context) {
    var eventText = JSON.stringify(event, null, 2);

    getMetadata(event, context, readMetadata);
};




function getMetadata(event, context, callback)
{
    //read out bucket
    var bucket = event.Records[0].s3.bucket.name;
    console.log("Bucket: ", bucket);

    //read out key
    var key = event.Records[0].s3.object.key;
    key = decodeURIComponent(key);
    console.log("Key: ", key);
    
    var s3 = new AWS.S3();
    var params = {
      Bucket: bucket, /* required */
      Key: key /* required */
    };
    s3.getObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        callback(err, data);
      } 
      else {

        callback(event, context, null, JSON.parse(data.Metadata.id));

      }    

    });
}




function readMetadata(event, context, err, meta) {
  if (err) {
    console.log(err, err.stack); // an error occurred
  } 
  else {

        console.log("Metadata: " + JSON.stringify(meta));           // successful response

        var email = meta.email;
        var lls = meta.lls;
        var topic = meta.topic;
        lookupRegistrationByLLS(event, context, email, topic, lls);
    }
}




function lookupRegistrationByLLS(event, context, email, topic, lls)
{
    console.log("Reverse lls->email lookup...");

    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: "CandidateRegistration",
        IndexName: 'lls-index',
        KeyConditionExpression: 'lls = :llskey',
        ExpressionAttributeValues: {
            ":llskey": lls
        }
    };
    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to read from Dynamo. Error JSON:" + JSON.stringify(err, null, 2));
        } else {
            console.log("Dynamo query succeeded:" + JSON.stringify(data, null, 2));

            if (data.Items.length > 0)
            {
                console.log("Registration found by LLS");

                //TODO: get the most recent one
                if (data.Items[0].email != null)
                {
                    email = data.Items[0].email;
                }
            }
            else {
            	(email = "emailnotfound");            		
            } 

            updateProblemTable(lls, parseProblemKey(event.Records[0].s3.object.key), true, config.PROBLEMTABLE.FIELDS.COMPLETED);
			buildNotification(event, context, topic, email);
        }
    });
}


function buildNotification(event, context, topic, email)
{
	email = encodeURI(email);

    //read out time
    var time = event.Records[0].eventTime;

    //read out bucket
    var bucket = event.Records[0].s3.bucket.name;

    //read out key
    var key = event.Records[0].s3.object.key;
    
    key = key.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); //strip illegal chars

    
    var mylink = "https://s3.amazonaws.com/public.yetanotherwhatever.io/" + key;

    console.log("Recieved event time: ", time);
    console.log("Email: ", email);
    console.log("Link: ", mylink);

    
	var subject = "Coding problem solution submitted";

    lookupTopicCaseInsensitive(topic, function(topic) {
		var message = "Time: " + time 
	        + "\nEmail: " + email  
	        + "\nBucket: " + bucket
	        + "\nKey: " + key
	        + "\nTopic: " + topic
	        + "\nDownload submitted code here: " + mylink
            + "\n\n\n\n\n";
		pub2SNS(message, subject, topic, context);
    });
}

function lookupTopicCaseInsensitive(notify, callback)
{
    var prefix = "arn:aws:sns:us-east-1:229763884986:";
    
    var dfault = "arn:aws:sns:us-east-1:229763884986:CodeUploaded";  //default
    
    var arn = prefix + notify.toLowerCase();
    
    var params = {
    };
    
    SNS.listTopics(params, function(err, data) {
        if (err) 
        {
            console.log("Error looking up SNS topic: " + arn);
            console.log(err.message);
            
        }
        else {  //success
        
            var topics = data.Topics;
            var i = 0
            for (; i < topics.length; i++)
            {
                if (arn == topics[i].TopicArn.toLowerCase())
                {
                    
                    console.log("SNS topic found: " + topics[i].TopicArn);
                    callback(topics[i].TopicArn);
                    return;
                }
                
            }
            
            console.log("SNS topic not found: " + arn);
        }

        console.log("Returning default topic, " + dfault);
        callback(dfault);
        return;
    });

}

function pub2SNS(message, subject, topic, context)
{
    console.log("Publishing to SNS topic: ", topic);

    
    var params = {
        Message: message,
        Subject: subject,
        TopicArn: topic
    };

    SNS.publish(params, context.done);
}



function parseProblemKey(keyStr) {
    const problemName = keyStr.split("/")[2];
    return config.PROBLEM_DIR + problemName + '.html';
}



function updateProblemTable(lls, problemKey, updatedValue, fieldName) {
    console.log("Updating problem entry in " + config.PROBLEMTABLE.NAME);

    const docClient = new AWS.DynamoDB.DocumentClient();
    const params = {
        TableName: config.PROBLEMTABLE.NAME,
        Key: {
            "lls" : lls,
            "problemKey" : problemKey,
        },
        UpdateExpression: 'set #attr = :newVal',
        ExpressionAttributeNames: {
            "#attr": fieldName,
        },
        ExpressionAttributeValues: {
            ":newVal": updatedValue,
        },
        ReturnValues: "UPDATED_NEW",
    }

    console.log(params);

    docClient.update(params, (err, data) => {
        if(err) {
            const errMessage = "Failed to update " + fieldName + " for user with lls " + lls + " in " + config.PROBLEMTABLE.NAME;
            console.error(errMessage + " Error JSON: ", JSON.stringify(err));
        } else {
            console.log("Updated " + fieldName + " for user with lls " + lls + " to " + updatedValue);
        }
    })
}

