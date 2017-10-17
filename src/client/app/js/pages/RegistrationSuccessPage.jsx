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
					<p>An email will be sent to {this.props.user.email} with a link to your personal page for next steps.</p>
				</div>
			</div>
		);
	}
}