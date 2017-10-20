import React, { Component } from 'react';



export default class ExistingProblem extends Component {
	constructor(props) {
		super();
	}

	render() {
		return (
			<div className={"problemCell " + this.props.problemClass} key={this.props.problemName}>
				<a target="_blank"
				   href={this.props.url}>
				   {this.props.problemName.toUpperCase()}
				</a>
				<span onClick={() => window.open(this.props.url,"_blank")}>
					click to go to problem
				</span>
			</div>
		)
	}
}