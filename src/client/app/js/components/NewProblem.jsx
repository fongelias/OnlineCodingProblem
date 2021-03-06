import React, { Component } from 'react';



export default class NewProblem extends Component {
	constructor(props) {
		super(props);

		this.state = {
			handleStartButtonText: "click here to start this problem",
			problemTitle: this.props.problemTitle.toUpperCase(),
		}

		this.handleStart = this.handleStart.bind(this);
	}

	handleStart() {
		if(confirm("You will have 48 hours to complete this problem once it is started. Are you sure you want to start this problem?")) {
			this.setState({
				handleStartButtonText: "",
				problemTitle: "Loading..."
			})
			this.props.startProblem(this.props.problemName);
		}
	}

	render() {
		return (
			<div className={"problemCell " + this.props.problemClass} key={this.props.problemName}>
				<a target="_blank"
				   href={this.props.url}>
				   {this.state.problemTitle}
				</a>
				<button onClick={this.handleStart}>{this.state.handleStartButtonText}</button>
			</div>
		)
	}
}