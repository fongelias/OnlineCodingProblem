
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



 function debug(msg)
 {
  if (window.location.href.indexOf('yetanotherwhatever.io') == -1)
  {
    alert(msg);
  }
 }

<!-- submit test output form -->
function setMeta(formName, email)
{

  var myObj = null;
  if (isDynamicPage())
  {
      myObj = { "problemname" : getProblemName(), "home" : getHome()};
  }
  else
  {
      //get email & sns topic
      myObj = { "email" : email, "topic" : getTopic(), "problemname" : getProblemName() , "home" : getHome() };
  }

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

  return (path.indexOf("tp/") != -1 && pageName.length == "0C109B3C-1FC3-4EEB-AF02-D604D476FF74.html".length);
}

function genSlnKey()
{

  if(!document.getElementById('outputFile').value)
  {
        alert("No file selected.");
        return false;
    }

  var uuid = Math.uuid();

  var formName = 'outputForm';
  var form = document.getElementById(formName);
  var keys = form.querySelectorAll("[name=key]");
  var keyInput = keys[0];

  var problemName = getProblemName();
  
  keyInput.value = "uploads/output/" + problemName + "/" + getLLS() + "/" + uuid;

  debug(keyInput.value);

  setMeta(formName);
}


<!-- code submission form -->

function genCodeKey()
{

  var email = getAndValidateEmail();
  if (!email)
  {
    return false; 
  }

  var fileName = document.getElementById('codeFile').value;
  if(!fileName)
  {
        alert("No file selected.");
        return false;
    }
    else if (-1 == fileName.indexOf(".zip"))
    {
      alert ("Selected file is not a .zip file.");
      return false;
    }
    else if (!confirm("Did you include your resume in your .zip file?"))
    {
      return false;
    }


  var uuid = Math.uuid();

  var formName = 'codeForm';
  var form = document.getElementById(formName);
  var keys = form.querySelectorAll("[name=key]");
  var keyInput = keys[0];

  var problemName = getProblemName();

  var topic = getTopic();

  keyInput.value = "uploads/code/" + problemName + "/" + getLLS() + "/" + email + "/" + topic + "/" + uuid + ".zip"; 

  debug(keyInput.value);

  setMeta(formName, email);

  return true;

}

function getAndValidateEmail()
{


  var emailInput = document.getElementById("email");
  var email = emailInput.value;

  if (!email || email.indexOf("@") == -1)
  {
    alert("Please enter a valid email address.")
    emailInput.className="fixThis";
    emailInput.focus();
    return null;
  }

  var _gaq = _gaq || [];
    _gaq.push(['_setCustomVar',1,'email', email, 1]);

  return email;
}

function setHome()
{
  var url = window.location.href;

  //TODO remove anchor, if there

  createVariable("home", url);
}

function getHome()
{
  return readVariable("home");
}



<!-- stats -->


function createVariable(name,value) {
    
    var date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    var expires = "; expires="+date.toGMTString();
    document.cookie = name+"="+value+expires+"; path=/";
}

function readVariable(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseVariable(name) {
    createCookie(name,"",-1);
}

function setLLS()
{
  var LLS = getLLS();

  if (!LLS)
  {
    var uuid = Math.uuid();
    createVariable("LLS", uuid);
  }
  else
  {
    //already set
  }

}

function getLLS()
{
    return readVariable("LLS");
}

setLLS();



function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getProblemName()
{

  return problemName; 
}

function setTopic()
{
  var topic = getParameterByName("topic");

  if (topic)
    createVariable(getProblemName() + "topic", topic);
}

function getTopic()
{
  var topic = readVariable(getProblemName() + "topic");
  if(!topic)
    topic = "none";

  return topic;
}

setTopic();

<!-- google analytics -->

  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-85846112-1', 'auto');
  ga('send', 'pageview');


 var _gaq = _gaq || [];

  var lls = getLLS();
  _gaq.push(['_setCustomVar',1,'LLS',lls, 1]);
    
    (function () { 
        var ga = document.createElement('script');
        ga.type = 'text/javascript'; 
        ga.async = true; 
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js'; 
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s); 
    })();
