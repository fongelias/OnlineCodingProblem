import React, { Component } from 'react';
import constants from '../constants.js';
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
					<p>Please complete both coding problems below.</p>
					<p className="text italic">Deadline: the Online Coding Problem portion of our 2018 Summer Internship search will be closing on {constants.campaign.endDateString}</p>
				</div>
				<div className="card">
					<p className="instructions">
						<span className="text red">You have 48 hours after starting each problem to complete it. </span>
						<br/>Each problem is expected to take about 4 hours or less.
						<br/>You may use any language or environment to solve these problems.
						<br/>After you have submitted a solution for both problems, you will be contacted to schedule an interview.
						<br/>Good luck, and we appreciate your interest in Symantec!
					</p>
					<ProblemGrid userProblems={this.props.user.problems}
								 problemKeyObj={this.props.problemKeyObj}
								 startProblem={this.props.startProblem}/>
				</div>
			</div>
		);
	}
	
}









