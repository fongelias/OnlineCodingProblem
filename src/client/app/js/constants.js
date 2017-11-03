//Computation for consts
//Date
const endDate = new Date("11/27/2017");
const endDateString = endDate.toLocaleDateString("en-US", {
	weekday: "long",
	day: "numeric",
	month: "long",
});


//Visibility API
// Set the name of the hidden property and the change event for visibility
let hidden = "";
let visibilityChange = ""; 

if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}


//Exposed Module
const constants = {
	dashboardPage: 'DASHBOARDPAGE',
	landingPage: 'LANDINGPAGE',
	registrationSuccessPage: 'REGISTRATIONSUCCESSPAGE',
	campaignOverPage: 'CAMPAIGNOVERPAGE',
	userRequests: 'https://widwml054h.execute-api.us-east-1.amazonaws.com/CandidateRegistrationStage/user',
	problemRequests: 'https://widwml054h.execute-api.us-east-1.amazonaws.com/CandidateRegistrationStage/problems',
	campaign: {
		endDate,
		endDateString,
	},
	visibilityAPI: {
		hidden,
		visibilityChange,
	},
}


export default constants;