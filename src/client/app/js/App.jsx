import React, { Component } from 'react';
//Components/Pages
import Header from './components/Header.jsx';
import Body from './components/Body.jsx';
import Cookie from './components/Cookie.js';
import constants from './constants.js';
import { isEmail } from './utils/';



export default class App extends Component {
	constructor(props) {
		super();

		this.state = {
			page: "",
			user: {
				lls: null,
				firstName: null,
				lastName: null,
				problems: [],
			},
			problemKeyObj: {},
		}


		this.registerUser = this.registerUser.bind(this);
		this.startProblem = this.startProblem.bind(this);
	}



	componentDidMount() {
		let lls = Cookie.getLLS();
		//console.log(lls);
		//'Login' User Based on LLS
		if(lls){
			fetch(constants.userRequests + "?lls=" + lls, {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				}
			}).then(response => response.json())
			.then(data => {
				//console.log(data);
				if(data.found) {
					this.setState({
						page: constants.dashboardPage,
						user: {
							lls,
							firstName: data.firstName,
							lastName: data.lastName,
							problems: data.problems,
						},
					});
				}
			});
		} else {
			lls = Cookie.setLLS();
			this.setState({
				user: {
					lls,
					firstName: this.state.user.firstName,
					lastName: this.state.user.lastName,
					problems: this.state.user.problems,
				}
			})
		}


		//Fetch Problem List
		fetch(constants.problemRequests, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			}
		}).then(response => response.json())
		.then(data => {
			//console.log(data);
			this.setState({
				problemKeyObj: data,
			});
		})
	}



	registerUser(firstName, lastName, email) {
		//console.log(firstName, lastName, email);

		if(firstName && lastName && email && isEmail(email)) {
			fetch(constants.userRequests, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					firstName,
					lastName,
					email,
					lls: Cookie.getLLS(),
				}),
			}).then(response => response.json())
			.then(data => {
				if(data.updateLls) {
					//Update lls if user already has an lls
					Cookie.setLLS(data.lls);
				}

				this.setState({
					page: constants.dashboardPage,
					user: {
						lls: data.lls,
						firstName: data.firstName,
						lastName: data.lastName,
						problems: data.problems,
					},
				});
			}).catch(err => {
				console.log(err);
			});
		}
	}


	startProblem(problemName) {
		const lls = this.state.user.lls;

		fetch(constants.problemRequests, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				problemName,
				lls,
			}),
		}).then(response => response.json())
		.then(data => {
			if(!data.err) {
				let newUserState = Object.assign({}, this.state.user);
				newUserState.problems.push(data);

				this.setState({
					user: newUserState,
				})
			} else {
				console.log(data.err);
			}
		})
	}



	render() {
		return (
			<div>
				<Header />
				<Body user={this.state.user} 
					  page={this.state.page}
					  registerUser={this.registerUser}
					  problemKeyObj={this.state.problemKeyObj}
					  startProblem={this.startProblem}/>
			</div>
		)
	}
}
