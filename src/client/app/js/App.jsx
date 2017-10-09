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
			page: constants.landingPage,
			user: {
				lls: null,
				firstName: null,
				lastName: null,
				problems: [],
			},
		}


		this.registerUser = this.registerUser.bind(this);
	}



	componentDidMount() {
		let lls = Cookie.getLLS();
		console.log(lls);
		if(lls){
			fetch(constants.userRequests + "?lls=" + lls, {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				}
			}).then(response => response.json())
			.then(data => {
				console.log(data);
				if(data.found) {
					this.setState({
						page: constants.dashboardPage,
						user: {
							lls,
							firstName: null,
							lastName: null,
							problems: [],
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
	}



	registerUser(firstName, lastName, email) {
		console.log(firstName, lastName, email);

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
			.then(data => console.log(data));
		}

	}



	render() {
		return (
			<div>
				<Header />
				<Body user={this.state.user} 
					  page={this.state.page}
					  registerUser={this.registerUser}/>
			</div>
		)
	}
}
