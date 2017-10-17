import React, { Component } from 'react';
import constants from '../constants.js';
import DashboardPage from '../pages/DashboardPage.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import RegistrationSuccessPage from '../pages/RegistrationSuccessPage.jsx';
import LoadingPage from '../pages/LoadingPage.jsx';

export default class Body extends Component {
	constructor(props) {
		super();
	}

	render() {
		switch(this.props.page) { 
			case constants.landingPage:
				return (
					<LandingPage registerUser={this.props.registerUser}/>
				);

			case constants.dashboardPage:
				return (
					<DashboardPage user={this.props.user}
								   problemKeyObj={this.props.problemKeyObj}
								   startProblem={this.props.startProblem}/>
				);
				break;

			case constants.registrationSuccessPage:
				return (
					<RegistrationSuccessPage user={this.props.user}/>
				);
				break;

			default:
				return (
					<LoadingPage/>
				);
		}



	}
}