console.log("Loading function");
var AWS = require("aws-sdk");
var SNS = new AWS.SNS();

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
	        + "\nDownload submitted code here: " + mylink;
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
            console.log("Returning default topic, " + dfault);
            
            callback(dfault);
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
            console.log("Returning default topic, " + dfault);
        }
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