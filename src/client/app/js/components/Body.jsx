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
			case constants.dashboardPage:
				return (
					<DashboardPage user={this.props.user} />
				);
				break;

			default:
				return (
					<LandingPage registerUser={this.props.registerUser}/>
				);
		}



	}
}