var config = require('../config/config');
var lib = require('./lib');
var pg = require('pg');

var databaseUrl;
if (config.PRODUCTION === config.PRODUCTION_LOCAL_DEV) databaseUrl = config.DATABASE_URL_LOCAL_DEV;
if (config.PRODUCTION === config.PRODUCTION_SERVER_1) databaseUrl = config.DATABASE_URL_SERVER_1;
if (config.PRODUCTION === config.PRODUCTION_SERVER_2) databaseUrl = config.DATABASE_URL_SERVER_2;

console.log('web server connected to db : [', databaseUrl, ']');
lib.log('info', 'web server connected to db : [' + databaseUrl + ']');

if (!databaseUrl) { throw new Error('must set DATABASE_URL environment var'); }

pg.types.setTypeParser(20, function (val) { // parse int8 as an integer
    return val === null ? null : parseInt(val);
});

// callback is called with (err, client, done)
function connect (callback) {
    return pg.connect(databaseUrl, callback);
}

function query (query, params, callback) {
    // third parameter is optional
    if (typeof params === 'function') {
        callback = params;
        params = [];
    }

    doIt();
    function doIt () {
        connect(function (err, client, done) {
            if (err) return callback(err);

            client.query(query, params, function (err, result) {
                done();
                if (err) {
                    if (err.code === '40P01') {
                        console.log('[DB_DEADLOCKED] retrying deadlocked transaction - query:' + query + '   params:' + params);
                        lib.log('error', '[DB_DEADLOCKED] retrying deadlocked transaction - query:' + query + '   params:' + params);
                        return doIt();
                    }
                    return callback(err);
                }

                callback(null, result);
            });
        });
    }
}

exports.query = query;

pg.on('error', function (err) {
    console.error('POSTGRES EMITTED AN ERROR:' + err);
    lib.log('error', 'POSTGRES EMITTED AN ERROR:' + err);
});

function getClient (runner, callback) {
    doIt();

    function doIt () {
        connect(function (err, client, done) {
            if (err) return callback(err);

            function rollback (err) {
                client.query('ROLLBACK', done);

                if (err.code === '40P01') {
                    console.log('[ROLLBACK] - retrying deadlocked transaction..');
                    lib.log('error', '[ROLLBACK] - retrying deadlocked transaction..');
                    return doIt();
                }

                callback(err);
            }

            client.query('BEGIN', function (err) {
                if (err) { return rollback(err); }

                runner(client, function (err, data) {
                    if (err) { return rollback(err); }

                    client.query('COMMIT', function (err) {
                        if (err) { return rollback(err); }

                        done();
                        callback(null, data);
                    });
                });
            });
        });
    }
}

/**
 * @created : 20180624
 * @author : WRT
 * @description : insert new address to database
 * @param : coin short name
 * @param : new address
 */
exports.registerNewAddress = function (coinShortName, newAddress, callback) {
    coinShortName = coinShortName.toLowerCase();
    var tableName = 'accounts_' + coinShortName;
    var sql = 'INSERT INTO ' + tableName + ' (address, txid, approx, created) VALUES ($1, 0, 0, NOW())';
    query(sql, [newAddress], function (error) {
        if (error) return callback(error);
        return callback(null);
    });
};

/**
 * @created : 20180624
 * @author : WRT
 * @description : get unused address from database
 * @param : coin short name
 */
exports.getUnlockedAddress = function (coinShortName, callback) {
    coinShortName = coinShortName.toLowerCase();
    var tableName = 'accounts_' + coinShortName;
    var sql = 'SELECT * FROM ' + tableName + ' WHERE txid=0';
    query(sql, function (error, result) {
        if (error) return callback(error);
        if (result.rowCount === 0) return callback(null, 'EMPTY');
        return callback(null, result.rows[0].address);
    });
};

/**
 * @created : 20180624
 * @author : WRT
 * @description : register new transaction
 * @param : trade information
 */
exports.registerTransaction = function (tradeInfo, callback) {
    var sql = 'INSERT INTO transactions (deposit_coin_name, receive_coin_name, dest_address, refund_address, send_address, order_id, trading_type, step, is_ended, created) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id';
    query(sql, [tradeInfo.depositShortName, tradeInfo.receiveShortName, tradeInfo.destAddress, tradeInfo.refundAddress, tradeInfo.sendAddress, tradeInfo.orderId, tradeInfo.tradingType, 15, false], function (error, txid_data) {
        if (error) {
            console.log('db.registerTransaction : error : ' + error);
            return callback(error);
        }

        var txid = parseInt(txid_data.rows[0].id);

        var accountsTableName = 'accounts_' + tradeInfo.depositShortName.toLowerCase();
        sql = 'UPDATE ' + accountsTableName + ' SET txid=$1 WHERE address=$2;';
        query(sql, [txid, tradeInfo.sendAddress], function (error) {
            if (error) return callback(error);
            return callback(null);
        });
    });
};

/**
 * @created : 20180625
 * @author : WRT
 * @description : get fee information per coins
 * @param : coin short name
 * @return : fee (miner_fee, site_fee)
 */
exports.getFeeInfo = function (coinShortName, callback) {
    var sql = 'SELECT miner_fee, site_fee FROM coins WHERE lower(short_name)=lower($1)';
    query(sql, [coinShortName], function (error, feeInfo) {
        if (error) {
            console.log('db.getFeeInfo - ' + error);
            return callback(error);
        }

        if (feeInfo.rowCount === 0) {
            console.log('db.getFeeInfo - fee_empty');
            return callback('FEE_EMPTY');
        }

        var fee = {};
        fee.miner_fee = feeInfo.rows[0].miner_fee;
        fee.site_fee = feeInfo.rows[0].site_fee;

        if (fee.miner_fee === null || fee.site_fee === null) {
            console.log('db.getFeeInfo - fee_null');
            return callback('FEE_NULL');
        }

        return callback(null, fee);
    });
};

/**
 * @created : 20180628
 * @author : WRT
 * @description : get current step
 * @param : orderId
 * @return : status
 */
exports.getStep = function (orderId, callback) {
    // var orderId =
    var sql = 'SELECT step FROM transactions WHERE lower(order_id)=lower($1)';
    query(sql, [orderId], function (error, stepInfo) {
        if (error) {
            console.log('db.getStep - order_id:' + orderId + '   - ' + error);
            return callback(error);
        }

        if (stepInfo.rowCount === 0) {
            console.log('db.getStep - order_id:' + orderId + '   : order_not_found');
            return callback('ORDER_NOT_FOUND');
        }

        return callback(null, stepInfo.rows[0].step);
    });
};

/**
 * @created : 20180702
 * @author : HWK
 * @description : get price info step
 * @return : status , price info
 */

function getPriceInfo (callback) {
    var sql = 'select * from coins order by id asc';
    query(sql, [], function (error, result) {
        if (error) {
            console.log('db.getPriceinfo : error');
            lib.log('error', 'db.getPriceInfo : error');
            return callback({status: 'failed', msg: 'Database Error'});
        }
        if (result.rowCount == 0) {
            console.log('db.getPriceInfo : Empty');
            lib.log('error', 'db.getPriceInfo : Empty');

            return callback({status: 'failed', msg: 'Empty'});
        }

        return callback(null, {status: 'success', msg: result.rows});
    });
}

exports.getPriceInfo = getPriceInfo;

/**
 * @created : 20180702
 * @author : HWK
 * @description : get coins info step
 * @return : status , price info
 */

function getCoinsInfo (callback) {
  var sql = 'select short_name, full_name from coins order by id asc'
  query(sql, [], function (error, result) {
    if (error) {
      console.log('db.getCoinsInfo : error')
      lib.log('error', 'db.getCoinsInfo : error')

      return callback({status: 'failed', msg: 'Database Error'})
    }
    if (result.rowCount == 0) {
      console.log('db.getCoinsInfo : Empty')
      lib.log('db.getCoinsInfo : Empty')

      return callback({status: 'failed', msg: 'Empty'})
    }
    return callback(null, {status: 'success', msg: result.rows})
  })
}

exports.getCoinsInfo = getCoinsInfo

/**
 * @created : 20180629
 * @author : WRT
 * @description : get price, fee .. information
 * @param : coin short name
 * @return : fee (miner_fee, site_fee)
 */
exports.getCoinInfo = function (coinShortName, callback) {
    var sql = 'SELECT price, miner_fee, site_fee FROM coins WHERE lower(short_name)=lower($1);';
    query(sql, [coinShortName], function (error, result) {
        if (error) {
            console.log('db.getCoinInfo - ' + error);
            return callback(error);
        }

        if (result.rowCount === 0) {
            console.log('db.getCoinInfo - fee_empty');
            return callback('COIN_INFO_EMPTY');
        }

        var coinInfo = {};
        coinInfo.price = result.rows[0].price;
        coinInfo.miner_fee = result.rows[0].miner_fee;
        coinInfo.site_fee = result.rows[0].site_fee;

        if (coinInfo.price === null || coinInfo.miner_fee === null || coinInfo.site_fee === null) {
            console.log('db.getCoinInfo - fee_null');
            return callback('COIN_INFO_NULL');
        }

        return callback(null, coinInfo);
    });
};

/**
 * @created : 20180704
 * @author : WRT
 * @description : get all information of transaction
 * @param : orderId
 * @return : information
 */
exports.getBookmarkInfo = function (orderId, callback) {
    var sql = 'SELECT * FROM transactions WHERE lower(order_id)=lower($1);';
    query(sql, [orderId], function (err, result) {
        if (err) {
            console.log('db.getBookmarkInfo- ' + err);
            return callback(err);
        }

        if (result.rowCount === 0) {
            console.log('db.getBookmarkInfo - not_found_order_id');
            return callback('NOT_FOUND');
        }

        var txInfo = {};
        txInfo.depositShortName = result.rows[0].deposit_coin_name;
        txInfo.receiveShortName = result.rows[0].receive_coin_name;
        txInfo.destAddress = result.rows[0].dest_address;
        txInfo.refundAddress = result.rows[0].refund_address;
        txInfo.sendAddress = result.rows[0].send_address;

        sql = 'SELECT full_name FROM coins WHERE lower(short_name)=lower($1);';
        query(sql, [txInfo.depositShortName], function (err, result) {
            if (err) return callback(err);
            if (result.rowCount === 0) return callback('NOT_FOUND_DEPOSIT_COIN');
            txInfo.depositFullName = result.rows[0].full_name;

            sql = 'SELECT full_name FROM coins WHERE lower(short_name)=lower($1);';
            query(sql, [txInfo.receiveShortName], function (err, result) {
                if (err) return callback(err);
                if (result.rowCount === 0) return callback('NOT_FOUND_RECEIVE_COIN');
                txInfo.receiveFullName = result.rows[0].full_name;

                return callback(null, txInfo);
            });
        });
    });
};
