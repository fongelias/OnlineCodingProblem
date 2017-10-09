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
			<div>
				<input ref="firstName" type="text" placeholder="First Name"/>
				<input ref="lastName" type="text" placeholder="Last Name" />
				<input ref="email" type="email" placeholder="Email" />
				<button onClick={this.handleSubmit}/>
			</div>
		)
	}
}