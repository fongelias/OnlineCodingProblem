import React, { Component } from 'react';
import { isEmail } from '../utils/';

export default class RegistrationForm extends Component {
	constructor(props) {
		super();

		this.handleSubmit = this.handleSubmit.bind(this);
		this.activateSubmit = this.activateSubmit.bind(this);
		this.handleKeyPress = this.handleKeyPress.bind(this);

		this.state = {
			submitButtonLabel: "",
			submitButtonDisabled: true,
			submitButtonText: "Submit your registration",
		};
	}

	handleSubmit() {
		const firstName = this.refs.firstName.value;
		const lastName = this.refs.lastName.value;
		const email = this.refs.email.value;

		if(firstName && lastName && email && isEmail(email) && (email.endsWith(".edu") || email.endsWith("symantec.com"))) {
			this.setState({
				submitButtonText: "Loading...",
				submitButtonDisabled: true,
			})
			this.props.registerUser(firstName, lastName, email);
		}
	}

	handleKeyPress(e) {
		if(e.key === 'Enter' && !this.state.submitButtonDisabled) {
			this.handleSubmit();
		}
	}

	activateSubmit() {
		const enrollmentStatus = this.refs.enrollmentStatusCheckbox.checked;
		const graduationStatus = this.refs.graduationStatusCheckbox.checked;

		if(graduationStatus && enrollmentStatus) {
			this.setState({
				submitButtonDisabled: false,
			})
		} else {
			this.setState({
				submitButtonDisabled: true,
			})
		}
	}

	render() {
		return (
			<div className="registrationForm form">
				<input ref="firstName" type="text" placeholder="First Name"/>
				<input ref="lastName" type="text" placeholder="Last Name" />
				<input ref="email" type="email" placeholder="Email" onKeyPress={this.handleKeyPress}/>
				<div className="input-group">
					<button ref="submitButton" className="submitButton" onClick={this.handleSubmit} disabled={this.state.submitButtonDisabled}>{this.state.submitButtonText}</button>
					<label htmlFor="submitButton">{this.state.submitButtonLabel}</label>
				</div>
				<div className="input-group">
					<input ref="enrollmentStatusCheckbox" type="checkbox" id="enrollmentStatusCheckbox" name="enrollmentStatus" onClick={this.activateSubmit}/>
					<label htmlFor="enrollmentStatusCheckbox">I will be enrolled as a full-time student in the semester beginning in Fall 2018</label>
				</div>
				<div className="input-group">
					<input ref="graduationStatusCheckbox" type="checkbox" id="graduationStatusCheckbox" name="enrollmentStatus" onClick={this.activateSubmit}/>
					<label htmlFor="graduationStatusCheckbox">I will be graduating by the summer of 2019</label>
				</div>
			</div>
		)
	}
}