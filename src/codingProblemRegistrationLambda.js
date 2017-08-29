var AWS = require('aws-sdk');
 
var SENDER = '"Registration" <noreply@yetanotherwhatever.io>';
var BUCKET = 'yetanotherwhatever.io';
var TABLE = "CandidateRegistration";

var s3 = createS3();

//lambda entry point
exports.handler = function (event, context) {
   
    var reg = validateRegistration(event);
        
}

//returns true if success
function validateRegistration(event)
{
    if (event.first == null ||
        event.last == null ||
        event.email == null ||
        event.lls == null)
    {
        console.error("Bad request, missing params: " + event.first + ", " + event.last + ", " + event.email + ", " + event.lls);
        return false;
    }


    //sanitize
    //anti xss
    event.email = encodeURI(event.email);
    event.first = encodeURI(event.first);
    event.last = encodeURI(event.last);
    event.lls = encodeURI(event.lls);

    lookupRegistrationByEmail(event);
}

function lookupRegistrationByEmail(event)
{
    console.log("Querying registrations by email");
    var dynClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: TABLE,
        Key:{
            "email": event.email
        }
    };

    dynClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
            
        } else {

            //record found
            if (data.Item != null)
            {
                console.log("Registration alread exists for this user, " + event.email);

                tellAndrew("WARNING existing registration resubmitted for: " + event.email, JSON.stringify(event));

                emailCandidate(event, data.Item.url);
            }
            else
            {
              console.log("This is a new email address being registered");
              lookupRegistrationByLLS(event);
            }
        } 
    });

    return true;
}



function lookupRegistrationByLLS(event)
{
    console.log("Querying registrations by lls");
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: TABLE,
        IndexName: 'lls-index',
        KeyConditionExpression: 'lls = :llskey',
        ExpressionAttributeValues: {
            ":llskey": event.lls
        }
    };

    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Query to Dynamo failed. Error JSON:" + JSON.stringify(err, null, 2));
        } else {

            if (data.Items.length > 0)
            {
               handleDuplicateRegistration(event, data);
            }
            else
            {
                console.log("This is a new lls being registered");
                selectRandProblemPage(event);
            }
        }
    });
}

function handleDuplicateRegistration(event, data)
{
    var oldReg = data.Items[0];
    var sub = "Existing registration found for LLS " + event.lls;
    var body = JSON.stringify(oldReg);
    console.error(sub);
    console.error(body);

    tellAndrew("WARNING" + sub, body);

    //now what?
    //pretend like nothing happened
    
    //supercede old registration, using existing problem url & key
    saveNewRegistration(event, oldReg.url, oldReg.problemKey);

    emailCandidate(event, oldReg.url);
}

function saveNewRegistration(event, url, problemKey)
{
    var docClient = new AWS.DynamoDB.DocumentClient();
    
    var now = new Date();

    var partitionsPerY = 1;

    var part = parseInt("" + now.getFullYear() + (now.getMonth() % partitionsPerY));

    var params = {
        TableName:TABLE,
        Item:{
            "email": event.email,
            "first": event.first,
            "last": event.last,
            "start-time": now.toLocaleString("America/New_York"),
            "epoch-part": part,
            "epoch-time": now.getTime(),
            "lls": event.lls,
            "problemKey": problemKey,
            "url": url,
            "topic": event.topic
        }
    };

    console.log("Saving to " + TABLE);

    docClient.put(params, function(err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2));
        }
    });

    var sub = "New coding problem registration: " + event.first + " " + event.last + ", " + event.email + ", topic=" + event.topic;
    var body = JSON.stringify(params);

    tellAndrew(sub, body);
}

function selectRandProblemPage(event)
{
    console.log("generating new problem page");

    //reading existing coding problems problems
    var prefix = "problems/"

    var params = {
          Bucket: BUCKET, /* required */
          Delimiter: '',
          EncodingType: 'url',
          Marker: '',
          MaxKeys: 100,
          Prefix: prefix,
          RequestPayer: 'requester'
        };

    s3.listObjects(params, function(err, data) {
      if (err)
        console.error(err, err.stack); // an error occurred
      else {
        
        //selecting a random problem page
        var size = data.Contents.length - 1 //ignore parent folder entry
        console.log("'" + prefix + "' contains " + size + " elements")
        var i = Math.floor(Math.random() * size) + 1
        console.log("Randomly selected index " + i)

        copyPage(data.Contents[i], event)
      } 
    });

}


function copyPage(s3Obj, event, url)
{
    //temp area will be http://yetanotherwhatever.io/tp/<UUID>.html
    var uuid = Math.uuid()
    var prefix = "tp/"
    var destKey = prefix + uuid + ".html"
    var url = "http://" + BUCKET + "/" + destKey

    console.log("Copying '" + s3Obj.Key + "' to '" + destKey + "'")
    
    s3.copyObject({
                Bucket: BUCKET,
                Key: destKey,
                
                CopySource: encodeURIComponent(BUCKET + '/' + s3Obj.Key),
                MetadataDirective: 'COPY'
            }, function (err, data) {
                if (err) {
                    console.error("Error copying '" + s3Obj.Key + "' to '" + destKey + "'");
                    console.error(err, err.stack); // an error occurred
                } else {
                    //email new page url
                    console.log("Successfully copied '" + s3Obj.Key + "' to '" + destKey + "'");

                    saveNewRegistration(event, url, s3Obj.Key);

                    emailCandidate(event, url)
                }
    });
}

// CreateS3
//
// Create a reference to an S3 client
// in the desired region.
function createS3(regionName) {
    var config = { apiVersion: '2006-03-01' };
    
    if (regionName != null)
        config.region = regionName;

    var s3 = new AWS.S3(config);
    return s3;
}

function emailCandidate (event, url, done) {

    var body = "Thank you for your interest in Symantec.\n\n" + 
      "Here is your unique link to the online coding problem: " + url
    var subject = "Symantec online coding problem"

    console.log("Sending email to: " + event.email)
    console.log("Subject: " + subject)
    console.log("Body: " + body)

    var params = {
        Destination: {
            ToAddresses: [
                event.email
            ]
        },
        Message: {
            Body: {
                Text: {
                    Data: body,
                    Charset: 'UTF-8'
                }
            },
            Subject: {
                Data: subject,
                Charset: 'UTF-8'
            }
        },
        Source: SENDER
    }

    var ses = new AWS.SES();
    ses.sendEmail(params, function(err, data) {
      if (err)
      {
            console.error("Error sending coding problem invitation email to '" + event.email + "'");
            console.error(err, err.stack); // an error occurred 
      }
      else {
        console.log("Emailed coding problem link to " + event.email);
      } 
    })
}


function tellAndrew(subject, body)
{
  var topic = "arn:aws:sns:us-east-1:229763884986:CodingProblem";

  var sns = new AWS.SNS();
  var params = {
      Message: body,
      Subject: subject,
      TopicArn: topic
  };
  sns.publish(params, function(err, data) {
    if (err)
    {
      console.error("Error publishing to topic " + topic);
      console.error(err, err.stack); 
    }
  });
}







/*!
Math.uuid.js (v1.4)
http://www.broofa.com
mailto:robert@broofa.com

Copyright (c) 2010 Robert Kieffer
Dual licensed under the MIT and GPL licenses.
*/

/*
 * Generate a random uuid.
 *
 * USAGE: Math.uuid(length, radix)
 *   length - the desired number of characters
 *   radix  - the number of allowable values for each character.
 *
 * EXAMPLES:
 *   // No arguments  - returns RFC4122, version 4 ID
 *   >>> Math.uuid()
 *   "92329D39-6F5C-4520-ABFC-AAB64544E172"
 *
 *   // One argument - returns ID of the specified length
 *   >>> Math.uuid(15)     // 15 character ID (default base=62)
 *   "VcydxgltxrVZSTV"
 *
 *   // Two arguments - returns ID of the specified length, and radix. (Radix must be <= 62)
 *   >>> Math.uuid(8, 2)  // 8 character ID (base=2)
 *   "01001010"
 *   >>> Math.uuid(8, 10) // 8 character ID (base=10)
 *   "47473046"
 *   >>> Math.uuid(8, 16) // 8 character ID (base=16)
 *   "098F4D35"
 */
(function() {
  // Private array of chars to use
  var CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

  Math.uuid = function (len, radix) {
    var chars = CHARS, uuid = [], i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random()*radix];
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
      uuid[14] = '4';

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join('');
  };

  // A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
  // by minimizing calls to random()
  Math.uuidFast = function() {
    var chars = CHARS, uuid = new Array(36), rnd=0, r;
    for (var i = 0; i < 36; i++) {
      if (i==8 || i==13 ||  i==18 || i==23) {
        uuid[i] = '-';
      } else if (i==14) {
        uuid[i] = '4';
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join('');
  };

  // A more compact, but less performant, RFC4122v4 solution:
  Math.uuidCompact = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };
})();