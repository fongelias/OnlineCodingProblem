import React, { Component } from 'react';



export default class NewProblem extends Component {
	constructor(props) {
		super();

		this.handleStart = this.handleStart.bind(this);
	}

	handleStart() {
		this.props.startProblem(this.props.problemName);
	}

	render() {
		return (
			<div className={"problemCell " + this.props.problemClass} key={this.props.problemName}>
				<a target="_blank"
				   href={this.props.url}>
				   {this.props.problemName.toUpperCase()}
				</a>
				<button onClick={this.handleStart}>click here to start this problem</button> 
			</div>
		)
	}
}