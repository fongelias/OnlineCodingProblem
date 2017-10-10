import React, { Component } from 'react';
import constants from '../constants.js';
import DashboardPage from '../pages/DashboardPage.jsx';
import LandingPage from '../pages/LandingPage.jsx';

export default class Body extends Component {
	constructor(props) {
		super();

		console.log(props);
		//this.handleSubmit = this.handleSubmit.bind(this);
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
								   problemKeyObj={this.props.problemKeyObj}/>
				);
				break;

			default:
				//Make this the loading page instead
				return (
					<LandingPage registerUser={this.props.registerUser}/>
				);
		}



	}
}