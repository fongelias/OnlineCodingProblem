import React, { Component } from 'react';
import ProblemGrid from '../components/ProblemGrid.jsx';




export default class DashboardPage extends Component {
	constructor(props) {
		super();
	} 

	render() {

		console.log(this.props.user);
		console.log(this.props.user.problems);
		return (
			<div className="pageBody dashboardPage">
				<div className="card blue">
					<h1>Hello, {this.props.user.firstName}.</h1>
					<p>Here are the steps you need to take to complete your interview:</p>
				</div>
				<div className="card">
					<p>Finish Coding Problems:<span className="text grey-lite">(You have 48 hours after starting each problem)</span></p>
					<ProblemGrid userProblems={this.props.user.problems}
								 problemKeyObj={this.props.problemKeyObj}/>
				</div>
			</div>
		);
	}
	
}









