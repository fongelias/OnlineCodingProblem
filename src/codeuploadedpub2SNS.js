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
    //will be in format: "uploads/code/jholler.combos/080DE7E9-882F-4622-B90B-0054DED5D097/test@test.com/FBB6B092-0B4A-4436-BCD8-3F378C825B8C.zip"
    var key = event.Records[0].s3.object.key;
    console.log("\nkey: ", key);
    //read out email
    var email = "";
    var tokens =  key.split("/", 10);
    if (tokens.length== 6)
    {
        var email = decodeURIComponent(tokens[4]);
    }
    console.log("\nEmail: ", email);
    
    var sns = new AWS.SNS();

    var topic = "arn:aws:sns:us-east-1:229763884986:CodeUploaded";
    if (key.indexOf("szhang") != -1)
    {
        topic = "arn:aws:sns:us-east-1:229763884986:SZhang";
    }
    if (key.indexOf("jholler") != -1)
    {
        topic = "arn:aws:sns:us-east-1:229763884986:JHoller";
    }

    console.log("\nTopic: ", topic);

    var params = {
        Message: "Time: " + time 
            + "\nEmail: " + email  
            + "\nBucket: " + bucket
            + "\nKey: " + key,
        Subject: "Coding problem solution submitted",
        TopicArn: topic
    };
    sns.publish(params, context.done);
};