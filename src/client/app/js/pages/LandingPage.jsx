import React, { Component } from 'react';
import constants from '../constants.js';
//Components
import RegistrationForm from '../Components/RegistrationForm.jsx';


export default class LandingPage extends Component {
	render() {
		return (
			<div className="pageBody landingPage">
				<div className="card blue">
					<h1>Symantec Cambridge</h1>
					<h1>Norton Cloud Services Team</h1>
					<p>2018 Summer Internship Online Coding Problem</p>
				</div>
				<div className="card">
					<p>Thank you for your interest in Symantec!</p>
					<p>The first step in our interview process will be two take-home coding exercises.</p>
					<p>The second step is a one-hour onsite interview (remote is also possible for students unable to visit our Cambridge office).</p>
					<p>Please register below to receive your personalized link containing further instructions.</p>
					<p className="text italic">Eligibility: You must be a full-time student in fall of 2018 who is also graduating by the summer of 2018 in order to participate in our internship</p>
					<p className="text italic">Deadline: the Online Coding Problem portion of our 2018 Summer Internship search will be closing on {constants.campaign.endDateString}</p>
					<p>Thanks!</p>
					<RegistrationForm registerUser={this.props.registerUser}/>
				</div>
			</div>
		);
	}
	
}