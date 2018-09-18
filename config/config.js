var fs = require('fs');

var productLocalDev = 'LOCAL_DEV';
var productServer1 = 'LINUX';
var productServer2 = 'WINDOWS';

var production;
production = productLocalDev;
// production = productServer1;
// production = productServer2;

var prodConfig;
if (production === productServer1 || production === productServer2) {
    prodConfig = JSON.parse(fs.readFileSync('./config/build-config.json'));
    console.log('-- [', prodConfig['main.min.js'], '] loaded.');
}

module.exports = {

    TESTNET: true,

    PRODUCTION: production,

    PRODUCTION_LOCAL_DEV: productLocalDev,
    PRODUCTION_SERVER_1: productServer1,
    PRODUCTION_SERVER_2: productServer2,

    DATABASE_URL_LOCAL_DEV: 'postgres://postgres:123456@localhost/anonexchangedb', // database url for local developmennt
    DATABASE_URL_SERVER_1: 'postgres://postgres:123456@47.75.43.93/anonexchangedb', // database url for linux server - test
    DATABASE_URL_SERVER_2: 'postgres://postgres:bmUgswMNVK9n4J7S@172.17.0.6/anonexchangedb', // database url for windows server - production

    SITE_URL_LOCAL_DEV: 'http://192.168.1.90',
    SITE_URL_SERVER_1: 'site_url_server_1',
    SITE_URL_SERVER_2: 'site_url_server_2',

    ETH_URL_LOCAL_DEV: 'http://localhost:8545', // eth rpc url for local - developmennt
    ETH_URL_SERVER_1: 'http://localhost:8545', // eth rpc url for linux server - test
    ETH_URL_SERVER_2: 'http://172.17.0.4:8545', // eth rpc url for windows server - production

    ETH_NEW_ACCOUNT_PASS: '123456789',

    // bitcoind for development
    BITCOIND_HOST_LOCAL_DEV: 'localhost',
    BITCOIND_PORT_LOCAL_DEV: 8332,
    BITCOIND_USER_LOCAL_DEV: 'wrt',
    BITCOIND_PASS_LOCAL_DEV: '3HTJFDMaDxiRc71jUkdyFcMFLwbB7rZHtY',
    // bitcoind for test
    BITCOIND_HOST_SERVER_1: 'localhost',
    BITCOIND_PORT_SERVER_1: 8332,
    BITCOIND_USER_SERVER_1: 'wrt',
    BITCOIND_PASS_SERVER_1: '3HTJFDMaDxiRc71jUkdyFcMFLwbB7rZHtY',
    // bitcoind for production
    BITCOIND_HOST_SERVER_2: 'localhost',
    BITCOIND_PORT_SERVER_2: 8332,
    BITCOIND_USER_SERVER_2: 'hmm4JzdD8cHT7e2u',
    BITCOIND_PASS_SERVER_2: 'T4ZKxSsE6hx3rw4RBjs4Uh6Cy5zQRp4X',

    PORT_HTTP: 80,
    PORT_HTTPS: 443,

    BUILD: prodConfig,

    HTTPS_KEY: './ssl/private.key',
    HTTPS_CERT: './ssl/certificate.crt',
    HTTPS_CA: './ssl/ca_bundle.crt',

    LOG_FILE: 'aew',

    SITE_TITLE: 'AnonExchange'
};
