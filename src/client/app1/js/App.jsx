import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
//Components/Pages
import Header from './components/Header.jsx';
import LandingPage from './pages/LandingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';


const App = () => (
	<div>
		<Header />
		<Switch>
			<PrivateRoute exact path='/' component={LandingPage} />
			<PrivateRoute path='/dashboard' component={DashboardPage} />
		</Switch>
	</div>
)


const PrivateRoute = ({component: Component, ...rest}) => (
	<Route {...rest} render={	
		props => (true ? (
				<Component {...props}/>
			) : (
				<Redirect to={{
					pathname: '/',
					state: {
						from: props.location
					},
				}}/>
			)
		)
	}/>
)



export default App;