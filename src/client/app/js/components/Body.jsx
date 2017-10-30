import React, { Component } from 'react';
import constants from '../constants.js';
import DashboardPage from '../pages/DashboardPage.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import RegistrationSuccessPage from '../pages/RegistrationSuccessPage.jsx';
import LoadingPage from '../pages/LoadingPage.jsx';
import CampaignOverPage from '../pages/CampaignOverPage.jsx';
import Footer from '../components/Footer.jsx';

export default class Body extends Component {
	constructor(props) {
		super();
	}

	render() {
		switch(this.props.page) { 
			case constants.landingPage:
				return (
					<div>
						<LandingPage registerUser={this.props.registerUser}/>
						<Footer/>
					</div>
				);
				break;

			case constants.dashboardPage:
				return (
					<div>
						<DashboardPage user={this.props.user}
									   problemKeyObj={this.props.problemKeyObj}
									   startProblem={this.props.startProblem}/>
						<Footer/>
					</div>
				);
				break;

			case constants.registrationSuccessPage:
				return (
					<div>
						<RegistrationSuccessPage user={this.props.user}/>
						<Footer/>
					</div>
				);
				break;

			case constants.campaignOverPage:
				return (
					<div>
						<CampaignOverPage/>
					</div>
				);
				break;

			default:
				return (
					<div>
						<LoadingPage/>
					</div>
				);
		}



	}
}