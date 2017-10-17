import React, { Component } from 'react';
import ExistingProblem from './ExistingProblem.jsx';
import NewProblem from './NewProblem.jsx';
import FinishedProblem from './FinishedProblem.jsx';
import { diffHours } from '../utils';




export default class ProblemGrid extends Component {
	constructor() {
		super();
	}


	render() {
		return (
			<div className="problemGrid">
				{
					Object.keys(this.props.problemKeyObj).map(problemName => {
						const userProblems = this.props.userProblems;
						let userProblemObj = {};


						//Locate Problem
						for(let i = 0; i < userProblems.length; i++) {
							console.log(userProblems[i]);
							if(userProblems[i].problemKey.indexOf(problemName) != -1) {
								userProblemObj = userProblems[i];
								break;
							}
						}
						

						const problemClass = userProblemObj.url ? 
							(userProblemObj.completed || 48 <= diffHours(Date.now(), new Date(userProblemObj["start-time"])) 
								? "finishedProblem" : "startedProblem")
							: "newProblem";

						switch(problemClass) {
							case "startedProblem":
								return (
									<ExistingProblem key={problemName}
													 problemClass={problemClass}
													 problemName={problemName}
													 url={userProblemObj.url}/>
								);
								break;
							case "newProblem":
								return (
									<NewProblem key={problemName}
												problemClass={problemClass}
												problemName={problemName}
												startProblem={this.props.startProblem}/>
								);
								break;
							case "finishedProblem":
								return (
									<FinishedProblem key={problemName}
													 problemClass={problemClass}
													 problemName={problemName}/>
								);
							default:
								return (
									<NewProblem key={problemName}
												problemClass={problemClass}
												problemName={problemName}
												startProblem={this.props.startProblem}/>
								);
						}

					})
				}
			</div>
		);
	}
}