//Computation for consts
//Date
const endDate = new Date("11/27/2017");
const endDateString = endDate.toLocaleDateString("en-US", {
	weekday: "long",
	day: "numeric",
	month: "long",
});


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
}


export default constants;