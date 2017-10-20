import React, { Component } from 'react';
import ProblemGrid from '../components/ProblemGrid.jsx';




export default class DashboardPage extends Component {
	constructor(props) {
		super();
	} 

	render() {
		return (
			<div className="pageBody dashboardPage">
				<div className="card blue">
					<h1>Hello, {this.props.user.firstName}.</h1>
					<p>Here are the steps you need to take to complete your interview:</p>
				</div>
				<div className="card">
					<h2 className="text bold">Finish Coding Problems:</h2>
					<p className="instructions">
						<span className="text red">You have 48 hours after starting each problem to complete it. </span>
						<br/>You can use any language or environment for these problems.
						<br/>When you are finished, your interviewer will contact you to for your next steps
					</p>
					<ProblemGrid userProblems={this.props.user.problems}
								 problemKeyObj={this.props.problemKeyObj}
								 startProblem={this.props.startProblem}/>
				</div>
			</div>
		);
	}
	
}









