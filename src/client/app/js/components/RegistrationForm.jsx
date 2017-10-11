import React, { Component } from 'react';

export default class RegistrationForm extends Component {
	constructor(props) {
		super();

		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit() {
		const firstName = this.refs.firstName.value;
		const lastName = this.refs.lastName.value;
		const email = this.refs.email.value;




		this.props.registerUser(firstName, lastName, email);
	}

	render() {
		return (
			<div className="registrationForm form">
				<input ref="firstName" type="text" placeholder="First Name"/>
				<input ref="lastName" type="text" placeholder="Last Name" />
				<input ref="email" type="email" placeholder="Email" />
				<button className="submitButton" onClick={this.handleSubmit}>Submit your registration</button>
			</div>
		)
	}
}