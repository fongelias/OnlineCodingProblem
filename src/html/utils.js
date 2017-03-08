

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
  var LEGAL = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var CHARS = LEGAL.split("");

  Math.uuid = function (len, radix) {
    var chars = CHARS;
    var uuid = [];
    var i;
    radix = radix || chars.length;

    if (len) {
      // Compact form
      for (i = 0;i < len; i+=1) {
        uuid[i] = chars[0 | Math.random()*radix];
      }
    } else {
      // rfc4122, version 4 form
      var r;

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
      uuid[14] = "4";

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0;i < 36;i+=1) {
        if (!uuid[i]) {
          r = 0 | Math.random()*16;
          uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
        }
      }
    }

    return uuid.join("");
  };

  // A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance
  // by minimizing calls to random()
  Math.uuidFast = function() {
    var chars = CHARS;
    var uuid = new Array(36);
    var rnd=0;
    var r;
    for (var i = 0;i < 36;i+=1) {
      if (i==8 || i==13 ||  i==18 || i==23) {
        uuid[i] = "-";
      } else if (i==14) {
        uuid[i] = "4";
      } else {
        if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
    return uuid.join("");
  };

  // A more compact, but less performant, RFC4122v4 solution:
  Math.uuidCompact = function() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };
})();









"use strict";




 function debug(msg)
 {
  if (window.location.href.indexOf("yetanotherwhatever.io") == -1)
  {
    alert(msg);
  }
 }


//show/hide email input
$(document).ready(function(){
  if (isDynamicPage())
  {
    $("#emaildiv").hide();
  }
});

//submit test output form
function setCodeMeta(formName, email)
{
  var myObj = {"email" : email,
  "topic" : getTopic(),
  "problemname" : getProblemName(),
  "referrer" : cleanLocation()};

  setMeta(formName, myObj);
}

function setOutputMeta(formName, uuid)
{
  var myObj = {"uuid" : uuid,
  "referrer" : cleanLocation(),
  "problemname" : getProblemName(),
  "lls" : getLLS(),
  "home" : getHome()};

  setMeta(formName, myObj);
}

function setMeta(formName, myObj)
{
  debug(JSON.stringify(myObj));

  var form = document.getElementById(formName);
  var meta = form.querySelectorAll("[name=x-amz-meta-id]");
  var metaInput = meta[0];
  metaInput.value=JSON.stringify(myObj);
}

function isDynamicPage()
{
  //page will have "/tp/" folder in the path
  //and will be named "<UUID>.html"

  var path = window.location.pathname;
  var pageName = path.split("/").pop();

  var uuid = "0C109B3C-1FC3-4EEB-AF02-D604D476FF74.html";
  var isDyn = path.indexOf("tp/") != -1 && pageName.length == uuid.length;

  return (isDyn);
}

function genSlnKey()
{
  if(!document.getElementById("outputFile").value)
  {
        alert("No file selected.");
        return false;
    }

  var uuid = Math.uuid();

  var formName = "outputForm";
  var form = document.getElementById(formName);
  var keys = form.querySelectorAll("[name=key]");
  var keyInput = keys[0];

  keyInput.value = "uploads/output/" + getProblemName() + "/" + getLLS() + "/" + uuid;

  debug(keyInput.value);

  setOutputMeta(formName, uuid);
}


// code submission form

function genCodeKey()
{

  var email = getAndValidateEmail();
  if (!email)
  {
    return false;
  }

  var fileName = document.getElementById("codeFile").value;
  if(!fileName)
  {
    alert("No file selected.");
    return false;
  }
  
  if (-1 == fileName.indexOf(".zip"))
  {
    alert ("Selected file is not a .zip file.");
    return false;
  }
  
  if (!confirm("Did you include your resume in your .zip file?"))
  {
    return false;
  }


  var uuid = Math.uuid();

  var formName = "codeForm";
  var form = document.getElementById(formName);
  var keys = form.querySelectorAll("[name=key]");
  var keyInput = keys[0];

  var problemName = getProblemName();

  var topic = getTopic();

  keyInput.value = "uploads/code/" + problemName + "/" + getLLS() + "/" + email + "/" + topic + "/" + uuid + ".zip";

  debug(keyInput.value);

  setCodeMeta(formName, email);

  return true;

}

function getAndValidateEmail()
{

  var email = "emailindb";
  if (!isDynamicPage())
  {
    var emailInput = document.getElementById("email");
    email = emailInput.value;

    if (!email || email.indexOf("@") == -1)
    {
      alert("Please enter a valid email address.");
      emailInput.className="fixThis";
      emailInput.focus();
      return null;
    }

    var _gaq = _gaq || [];
      _gaq.push(["_setCustomVar",1,"email", email, 1]);

  }

  return email;
}

//stats
function createVariable(name,value) {
    var date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    var expires = ";expires="+date.toGMTString();
    document.cookie = name+"="+value+expires+";path=/";
}

function readVariable(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    var c;
    for (i=0;i < ca.length;i+=1) {
        c = ca[i];
        while (c.charAt(0)==" ") 
        {
          c = c.substring(1,c.length);
        }
        if (c.indexOf(nameEQ) == 0)
        {
          return c.substring(nameEQ.length,c.length);
        }
    }
    return null;
}

function setLLS()
{
  var LLS = getLLS();

  if (!LLS)
  {
    var uuid = Math.uuid();
    createVariable("LLS", uuid);
  }

}

function getLLS()
{
    return readVariable("LLS");
}

setLLS();


function cleanLocation()
{
  var location = document.location.protocol + "//" + window.location.hostname + window.location.pathname;
  return location;
}

function setHome()
{
  createVariable("home", cleanLocation());
}

function getHome()
{
  return readVariable("home");
}

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(url);
    if (!results)
      {
        return null;
      }
    if (!results[2])
    {
      return "";
    }
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getProblemName()
{
  //this var is set by the base page
  return problemName;
}

function setTopic()
{
  var topic = getParameterByName("topic");

  if (topic)
  {
    createVariable("topic", topic);
  }

  debug("Topic:" + topic);
}

setTopic();

function getTopic()
{
  var topic = readVariable("topic");
  if(!topic)
  {
    topic = "none";
  }

  return topic;
}






// google analytics

  (function(i,s,o,g,r,a,m){i["GoogleAnalyticsObject"]=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,"script","https://www.google-analytics.com/analytics.js","ga");

  ga("create", "UA-85846112-1", "auto");
  ga("send", "pageview");


 var _gaq = _gaq || [];

  var lls = getLLS();
  _gaq.push(["_setCustomVar",1,"LLS",lls, 1]);
  a
    (function () {
        var ga = document.createElement("script");
        ga.type = "text/javascript";
        ga.async = true;
        ga.src = ("https:" == document.location.protocol ? "https://ssl" : "http://www") + ".google-analytics.com/ga.js";
        var s = document.getElementsByTagName("script")[0];s.parentNode.insertBefore(ga, s);
    })();
