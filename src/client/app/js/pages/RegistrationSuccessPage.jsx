import React, { Component } from 'react';

export default class RegistrationSuccessPage extends Component {
	constructor(props) {
		super();
	}

	render() {
		return (
			<div className="pageBody registrationSuccessPage">
				<div className="card blue">
					<h1>Symantec Interview Portal</h1>
					<p>You have successfully registered for an account.</p>
				</div>
				<div className="card center">
					<p>Please check your email, <span className="text bold">{this.props.user.email}</span> for an invitation with a link to your personal page for next steps.</p>
					<p>If you do not see our email in your inbox, please check your span folder. Thanks!</p>
				</div>
			</div>
		);
	}
}