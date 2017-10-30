import React, { Component } from 'react';

export default class RegistrationForm extends Component {
	constructor(props) {
		super();

		this.handleSubmit = this.handleSubmit.bind(this);
		this.activateSubmit = this.activateSubmit.bind(this);

		this.state = {
			submitButtonLabel: "",
			submitButtonDisabled: true,
		};
	}

	handleSubmit() {
		const firstName = this.refs.firstName.value;
		const lastName = this.refs.lastName.value;
		const email = this.refs.email.value;

		this.props.registerUser(firstName, lastName, email);
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
				<input ref="email" type="email" placeholder="Email" />
				<div className="input-group">
					<button ref="submitButton" className="submitButton" onClick={this.handleSubmit} disabled={this.state.submitButtonDisabled}>Submit your registration</button>
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