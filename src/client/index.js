//Dependencies
var express = require('express');


//Config
var config = {
	port: 8080,
	env: 'development'
};



//Set Environment
process.env.NODE_ENV = config.env;

//Instantiate
var app = express();
app.use(express.static('public'));

//Set Port
var server = app.listen(config.port);

//Expose Modules
exports.app = app;
exports.server = server;


console.log(process.env.NODE_ENV + 'server running at: '  + config.port);