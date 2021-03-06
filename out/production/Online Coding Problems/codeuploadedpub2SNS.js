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

function readMetadata(event, context, err, data) {
  if (err) {
    console.log(err, err.stack); // an error occurred
  } 
  else {

        console.log("Metadata: " + JSON.stringify(data));           // successful response

        var meta = data;

        var email = "";
        var topic = "arn:aws:sns:us-east-1:229763884986:CodeUploaded";

        //lookup by id
        if (meta.id != null)
        {
            //TODO
            email = "lookup";
            topic = "arn:aws:sns:us-east-1:229763884986:CodeUploaded";
        }
        //else use metadata properties
        else
        {
            if(meta.email != null)
            {
                email = meta.email;
            }
            else
            {
                console.log("Error: no email address");
            }


            //get topic
            var notify = meta.topic;
            //default
            topic = "arn:aws:sns:us-east-1:229763884986:CodeUploaded";
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
        } 

        pub2SNS(event, context, topic, email);
    }
}


function pub2SNS(event, context, topic, email, bucket, key)
{

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