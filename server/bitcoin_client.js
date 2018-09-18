var bitcoin = require('bitcoin');
var config = require('../config/config');
var lib = require('./lib');

var btcHost;
var btcPort;
var btcUser;
var btcPass;

if (config.PRODUCTION === config.PRODUCTION_LOCAL_DEV) {
    btcHost = config.BITCOIND_HOST_LOCAL_DEV;
    btcPort = config.BITCOIND_PORT_LOCAL_DEV;
    btcUser = config.BITCOIND_USER_LOCAL_DEV;
    btcPass = config.BITCOIND_PASS_LOCAL_DEV;
} else if (config.PRODUCTION === config.PRODUCTION_SERVER_1) {
    btcHost = config.BITCOIND_HOST_SERVER_1;
    btcPort = config.BITCOIND_PORT_SERVER_1;
    btcUser = config.BITCOIND_USER_SERVER_1;
    btcPass = config.BITCOIND_PASS_SERVER_1;
} else if (config.PRODUCTION === config.PRODUCTION_SERVER_2) {
    btcHost = config.BITCOIND_HOST_SERVER_2;
    btcPort = config.BITCOIND_PORT_SERVER_2;
    btcUser = config.BITCOIND_USER_SERVER_2;
    btcPass = config.BITCOIND_PASS_SERVER_2;
}

var client = new bitcoin.Client({
    host: btcHost,
    port: btcPort,
    user: btcUser,
    pass: btcPass,
    timeout: 240000
});

console.log('btc - connected to bitcoind-rpc : [' + btcHost + ':' + btcPort + ']');
lib.log('info', 'btc - connected to bitcoind-rpc : [' + btcHost + ':' + btcPort + ']');

module.exports = client;
