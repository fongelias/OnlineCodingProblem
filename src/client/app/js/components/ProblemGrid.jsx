import React, { Component } from 'react';



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



						//Disable based on date and availability of url
						//Start problem button

						const problemClass = userProblemObj.url ? "startedProblem" : "";

						return (
							<div className={"problemCell " + problemClass} key={problemName}>
								<a target="_blank"
								   href={userProblemObj.url}>
								   {problemName.toUpperCase()}
								</a>
								{
									!userProblemObj.url ? 
										<button data-id={userProblemObj.problemKey}>click here to start this problem</button> 
										: <span>click to go to problem</span>
									
								}
							</div>
						)
					})
				}
			</div>
		);
	}
}