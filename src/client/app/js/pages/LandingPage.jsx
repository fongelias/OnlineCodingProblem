import React, { Component } from 'react';
//Components
import RegistrationForm from '../Components/RegistrationForm.jsx';


export default class LandingPage extends Component {
	render() {
		return (
			<div className="pageBody">
				<h1>Symantec Interview Portal</h1>
				<p>Register for an account to begin your interview</p>
				<RegistrationForm registerUser={this.props.registerUser}/>
			</div>
		);
	}
	
}