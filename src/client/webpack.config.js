//DEPENDENCIES=============================================================
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
//Module==================================================================
module.exports = {
	entry: { //Where bundler starts
		yetAnotherWhateverApp: './app/js/yetAnotherWhateverApp.jsx'
	},
	output: { //Where bundled code is to be saved
		path: path.resolve('public/'), 
		filename: './js/[name].js'
	},
	module: {
		loaders: [ //Transformations
			{test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/},
			{test: /\.jsx$/, loader:'babel-loader', exclude: /node_modules/},
			{test: /\.scss$/, loader: ExtractTextPlugin.extract('css-loader!sass-loader')},
			{test: /\.(woff|woff2|eot|ttf|otf)$/, loader: 'url-loader?limit=65000&mimetype=application/font-woff&name=../fonts/[name].[ext]'}
		]
	},
	devtool: "cheap-eval-source-map",
	plugins: [
		new ExtractTextPlugin({
			filename: './css/[name].css',
			allChunks: true
		}),
		new CopyWebpackPlugin([
			{from: './app/index.html', to: './index.html'},
			//{from: './dev/serviceWorker.js', to: './serviceWorker.js'},
			//{from: './dev/manifest.json', to: './manifest.json'}
		]),
	    /*new webpack.DefinePlugin({
	      'process.env.NODE_ENV': JSON.stringify('production')
	    })*/
	]
}