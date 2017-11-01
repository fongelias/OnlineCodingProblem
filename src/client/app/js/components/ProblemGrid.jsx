import React, { Component } from 'react';
import ExistingProblem from './ExistingProblem.jsx';
import NewProblem from './NewProblem.jsx';
import FinishedProblem from './FinishedProblem.jsx';




export default class ProblemGrid extends Component {
	constructor() {
		super();
	}

	render() {
		return (
			<div className="problemGrid">
				{
					this.props.userProblemObjList.map((problemObj) => {
						switch(problemObj.problemClass) {
							case "startedProblem":
								return (
									<ExistingProblem key={problemObj.problemName}
													 problemClass={problemObj.problemClass}
													 problemTitle={problemObj.problemTitle}
													 problemName={problemObj.problemName}
													 url={problemObj.url}/>
								);
								break;
							case "newProblem":
								return (
									<NewProblem key={problemObj.problemName}
												problemClass={problemObj.problemClass}
												problemTitle={problemObj.problemTitle}
												problemName={problemObj.problemName}
												startProblem={this.props.startProblem}/>
								);
								break;
							case "finishedProblem":
								return (
									<FinishedProblem key={problemObj.problemName}
													 problemClass={problemObj.problemClass}
													 problemTitle={problemObj.problemTitle}
													 problemName={problemObj.problemName}/>
								);
							default:
								return (
									<NewProblem key={problemObj.problemName}
												problemClass={problemObj.problemClass}
												problemTitle={problemObj.problemTitle}
												problemName={problemObj.problemName}
												startProblem={this.props.startProblem}/>
								);
						}

					})
				}
			</div>
		);
	}
}