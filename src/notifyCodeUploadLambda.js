console.log("Loading function");
var AWS = require("aws-sdk");

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
        var topic =  translateTopic(meta.topic);
        var lls = meta.lls;

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

            pub2SNS(event, context, topic, email);
        }
    });
}

function translateTopic(notify)
{
    //default
    var topic = "arn:aws:sns:us-east-1:229763884986:CodeUploaded";
    if (notify != null)
    {
        if (notify.indexOf("szhang") != -1)
        {
            topic = "arn:aws:sns:us-east-1:229763884986:SZhang";
        }
        if (notify.indexOf("jholler") != -1)
        {
            topic = "arn:aws:sns:us-east-1:229763884986:JHoller";
        }
    }

    return topic;

}


function pub2SNS(event, context, topic, email)
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

    console.log("Topic: ", topic);

    var sns = new AWS.SNS();
    var params = {
        Message: "Time: " + time 
            + "\nEmail: " + email  
            + "\nBucket: " + bucket
            + "\nKey: " + key
            + "\nDownload submitted code here: " + mylink,
        Subject: "Coding problem solution submitted",
        TopicArn: topic
    };
    sns.publish(params, context.done);
}