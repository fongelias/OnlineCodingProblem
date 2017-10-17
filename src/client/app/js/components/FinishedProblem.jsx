import React, { Component } from 'react';



export default class FinishedProblem extends Component {
	constructor(props) {
		super();
	}



	render() {
		return (
			<div className={"problemCell " + this.props.problemClass} key={this.props.problemName}>
				<a>{this.props.problemName.toUpperCase()}</a>
				<span>You have finished this problem</span>
			</div>
		)
	}
}