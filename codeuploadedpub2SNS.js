console.log("Loading function");
var AWS = require("aws-sdk");

exports.handler = function(event, context) {
    var eventText = JSON.stringify(event, null, 2);
    
    
    //read out time
    var time = event.Records[0].eventTime;
    console.log("\nRecieved event time: ", time);
    //read out bucket
    var bucket = event.Records[0].s3.bucket.name;
    console.log("\nBucket: ", bucket);
    //read out key
    //will be in format: "code/combos/<tracking GUID>/<email>/<file GUID.zip>"
    var key = event.Records[0].s3.object.key;
    console.log("\nkey: ", key);
    //read out email
    var email = "";
    var tokens =  key.split("/", 10);
    if (tokens.length== 5)
    {
        var email = tokens[3];
    }
    console.log("\nEmail: ", email);
    
    var sns = new AWS.SNS();
    var params = {
        Message: "Time: " + time 
            + "\nEmail: " + email  
            + "\nBucket: " + bucket
            + "\nKey: " + key,
        Subject: "Coding problem solution submitted",
        TopicArn: "arn:aws:sns:us-east-1:229763884986:CodeUploaded"
    };
    sns.publish(params, context.done);
};