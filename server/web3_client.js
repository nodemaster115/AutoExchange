var lib = require('./lib');
var config = require('../config/config');
var Web3 = require('web3');

var ethUrl;
if (config.PRODUCTION === config.PRODUCTION_LOCAL_DEV) ethUrl = config.ETH_URL_LOCAL_DEV;
if (config.PRODUCTION === config.PRODUCTION_SERVER_1) ethUrl = config.ETH_URL_SERVER_1;
if (config.PRODUCTION === config.PRODUCTION_SERVER_2) ethUrl = config.ETH_URL_SERVER_2;

let provider = new Web3.providers.HttpProvider(ethUrl);
const web3 = new Web3(provider);

console.log('eth - connected to geth-rpc : [' + ethUrl + ']');
lib.log('info', 'eth - connected to geth-rpc : [' + ethUrl + ']');

module.exports = web3;
