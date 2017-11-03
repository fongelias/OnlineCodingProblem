import React, { Component } from 'react';
import constants from '../constants.js';
import ProblemGrid from '../components/ProblemGrid.jsx';
import { diffHours } from '../utils';




export default class DashboardPage extends Component {
	constructor(props) {
		super();

		this.formatProblemKeyObj = this.formatProblemKeyObj.bind(this);
	} 

	formatProblemKeyObj() {
		return Object.keys(this.props.problemKeyObj).map((problemName, i) => {
			const userProblems = this.props.user.problems;
			const problemTitle = "Problem " + (i + 1);
			let userProblemObj = {};


			//Locate Problem
			for(let i = 0; i < userProblems.length; i++) {
				console.log(userProblems[i]);
				if(userProblems[i].problemKey.indexOf(problemName) != -1) {
					userProblemObj = userProblems[i];
					break;
				}
			}
			
			const timeLimitOver = 48 <= diffHours(Date.now(), new Date(userProblemObj["start-time"]));
			const problemClass = userProblemObj.url ? 
				((userProblemObj.completed || timeLimitOver) 
					? "finishedProblem" : "startedProblem")
				: "newProblem";

			return {
				problemName,
				problemTitle,
				problemClass,
				completed: userProblemObj.completed || timeLimitOver,
				url : userProblemObj.url,
			};
		});
	}


	render() {

		const userProblemObjList = this.formatProblemKeyObj();
		const testsCompleted = userProblemObjList.length > 0 ? userProblemObjList.map(obj => obj.completed).reduce((p,c) => p && c, true) : false;

		return (
			<div className="pageBody dashboardPage">
				<div className="card blue">
					<h1>Hello, {this.props.user.firstName}.</h1>
					<p>Please complete both coding problems below.</p>
					<p className="text italic">Deadline: the coding problems will close end of day, {constants.campaign.endDateString}. Interviews may be held after{constants.campaign.endDateString.split(',')[1]}.</p>
				</div>
				<div className="card">
					{
						(() => {
							return testsCompleted ?
								(<p className="instructions">
									<span className="text bold">Thank you!</span>
									<br/>We have received your coding solutions, and will be reaching out to you shortly with feedback and further instruction
									<br/>If you have any questions, you may contact <a href="mail://andrew_chang@symantec.com">andrew_chang@symantec.com</a>
								</p>)
								: (<p className="instructions">
									<span className="text red">You have 48 hours after starting each problem to complete it. </span>
									<br/>Each problem is expected to take about 4 hours or less.' +
									<br/>You may use any language or environment to solve these problems.' +
									<br/>After you have submitted a solution for both problems, you will be contacted to schedule an interview.
									<br/>Good luck, and we appreciate your interest in Symantec!
								</p>);
						})()
					}
					<ProblemGrid userProblemObjList={userProblemObjList}
								 startProblem={this.props.startProblem}/>
					<p className="text center">{ testsCompleted ? "You've finished both tests! You will be contacted to schedule an interview." : "" }</p>
				</div>
			</div>
		);
	}
	
}









