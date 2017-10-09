import React, { Component } from 'react';

export default class RegistrationForm extends Component {
	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		if(e.key === 'Enter') {
			//Submit form here
		}
	}

	render() {
		return (
			<div>
				<input ref="firstName" type="text" placeholder="First Name"/>
				<input ref="lastName" type="text" placeholder="Last Name" />
				<input ref="email" type="email" placeholder="Email" />
			</div>
		)
	}
}