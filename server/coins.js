var lib = require('./lib');
var config = require('../config/config');
var db = require('./database');

var btc_client = require('./bitcoin_client');
var eth_client = require('./web3_client');
var async = require('async');

/**
 * @created : 20180624
 * @author : WRT
 * @description : make new account(address) to each wallet and register into database
 * @param : coin short name
 * @return : new address for each coin
 */
exports.makeNewAddress = function (coinShortName, callback) {
    if (coinShortName === 'btc') {
        // ********************************************************************************************* Bitcoin : BTC : makeNewAddress *******************************************************************
        btc_client.getNewAddress(function (err, newAddress) {
            if (err) {
                console.log('coins - error - btc - btc_client.getNewAddress - ' + err);
                lib.log('error', 'coins - btc - btc_client.getNewAddress - ' + err);
                return callback(err);
            }

            console.log('coins - success - btc - btc_client.getNewAddress - newAddress : ' + newAddress);
            lib.log('success', 'coins - btc - btc_client.getNewAddress - newAddress : ' + newAddress);

            db.registerNewAddress(coinShortName, newAddress, function (error) {
                if (error) {
                    console.log('coins - error - btc - db.registerNewAddress - ' + error);
                    lib.log('error', 'coins - btc - db.registerNewAddress - ' + error);
                    return callback(error);
                }

                return callback(null, newAddress);
            });
        });
    } else if (coinShortName === 'eth') {
        // ********************************************************************************************* Ethereum : ETH : makeNewAddress *******************************************************************
        eth_client.eth.personal.newAccount(config.ETH_NEW_ACCOUNT_PASS, function (err, newAddress) {
            if (err) {
                console.log('coins - error - eth - eth.personal.newAccount - ' + err);
                lib.log('error', 'coins - eth - eth.personal.newAccount - ' + err);
                return callback(err);
            }

            console.log('coins - success - eth - eth.personal.newAccount - newAddress : ' + newAddress);
            lib.log('success', 'coins - eth - eth.personal.newAccount - newAddress : ' + newAddress);

            db.registerNewAddress(coinShortName, newAddress, function (error) {
                if (error) {
                    console.log('coins - error - eth - db.registerNewAddress - ' + error);
                    lib.log('error', 'coins - eth - db.registerNewAddress - ' + error);
                    return callback(error);
                }

                return callback(null, newAddress);
            });
        });
    }
};

/**
 * @created : 20180705
 * @author : WRT
 * @description : check bitcoin confirmation
 * @param : txhash : transaction hash
 * @param : tableId : id in transactions table
 * @return : txhash
 */
var g_intervalConfirm = 1000;
var g_confirmation = 0;
var checkBTCConfirmation = function (txHash, tableId, callback) {
    btc_client.listUnspent(function (err, unspent) {
        if (err) return callback(err);

        var bFound = false;
        var confirmations = 0;
        for (var nId = 0; nId < unspent.length; nId++) {
            var transaction = unspent[nId];
            var txid = transaction.txid;
            if (txid === txHash) {
                bFound = true;
                confirmations = transaction.confirmations;
                confirmations = parseInt(confirmations);
                // console.log('confirmation - txhash : ', txHash, '   confirmations : ', confirmations);
                break;
            }
        }

        if (g_confirmation <= confirmations) {
            var step = 50 + g_confirmation * 25;
            db.updateStateByTableId(tableId, step, function () {
                // console.log('updateState by table id');
            });

            g_confirmation++;
        }

        if (bFound && confirmations > 1) {
            // console.log('checkBTCConfirmation - returned.');
            g_confirmation = 0;
            return callback(null, txHash);
        } else {
            // console.log('run more setTimeout');
            setTimeout(function () {
                checkBTCConfirmation(txHash, tableId, callback);
            }, g_intervalConfirm);
        }
    });
};

/**
 * @created : 20180626
 * @author : WRT
 * @description : send from specified account to dest address : eth
 * @param : fromAccount : source address of eth transmission
 * @param : destAddress : destnation of eth trasmission
 * @param : amount : transmission amount : unit WEI ( 1ETH = 1E18 )
 * @param : bLastSend : boolean : whether this call is the last call of several transmission from several account
 * @param : tableId : id of transaction table which is being dealed.
 * @return : hash
 */
function sendETHCoin (fromAccount, destAddress, amount, bLastSend, tableId, callback) {
    console.log('sendETHCoin : fromAccount : ' + fromAccount + '   destAddress : ' + destAddress + '   amount : ' + amount / 1e18);
    amount = eth_client.utils.toHex(amount);

    var txHash = null;
    eth_client.eth.personal.unlockAccount(fromAccount, config.ETH_NEW_ACCOUNT_PASS, 600)
        .then(function (result) {
            eth_client.eth.sendTransaction({
                from: fromAccount,
                to: destAddress,
                value: amount
            })
                .on('transactionHash', function (hash) {
                    console.log('on_transactionHash - ' + hash);
                    txHash = hash;
                    if (bLastSend === true) {
                        db.updateState(tableId, 65, function (err) {
                            if (err) return callback(err);
                        });
                    }
                })
                .on('receipt', function (receipt) {
                    // console.log('on_receipt - ', receipt);
                    if (bLastSend === true) {
                        db.updateState(tableId, 100, function (err) {
                            if (err) return callback(err);
                        });
                    }

                    return callback(null, txHash);
                })
                .on('error', function (err) {
                    console.log('eth.send - error - eth.sendTransaction - ' + err);
                    return callback(err);
                })
                .catch(function (err) {
                    console.log('eth.send - error - eth.sendTransaction - ' + err);
                    return callback(err);
                });
        }).catch(function (err) {
        console.log('eth.send - error - eth.personal.unlockAccount - ' + err);
        return callback(err);
    });
}

/**
 * @created : 201806250256
 * @author : WRT
 * @description : send coin amount to specified address
 * @param : coinShortname : coin short name
 * @param : destAddress : destAddress to receive
 * @param : amount : amount to send
 * @param : tableId :
 * @return : transaction hash
 */
var sendCoin = function (coinShortName, destAddress, amount, tableId, callback) {
    getBalanceInfo(coinShortName, function (err, balanceInfo) {
        if (err) {
            console.log('sendCoin - error : ' + err);
            return callback(err);
        }

        if (balanceInfo.sendableBalance < amount) {
            console.log('sendCoin - error : NOT_ENOUGH - sendableBalance : ', balanceInfo.sendableBalance, '   amount : ', amount);
            return callback('NOT_ENOUGH');
        }

        if (coinShortName === 'btc') {
            // ********************************************************************************************* Bitcoin : BTC : sendCoin *******************************************************************
            var sendAmount = amount.toFixed(8);
            btc_client.sendToAddress(destAddress, sendAmount, function (err, txHash) {
                if (err) {
                    console.log('coins - error - btc - btc_client.sendToAddress - ' + err);
                    lib.log('error', 'coins - btc - btc_client.sendToAddress - ' + err);
                    return callback(err);
                }

                console.log('coins - success - btc - btc_client.sendToAddress - txHash : ' + txHash);
                lib.log('success', 'coins - btc - btc_client.sendToAddress - txHash : ' + txHash);

                setTimeout(function () {
                    checkBTCConfirmation(txHash, tableId, callback);
                }, g_intervalConfirm);
            });
        } else if (coinShortName === 'eth') {
            // ********************************************************************************************* Ethereum : ETH : sendCoin *******************************************************************
            db.getCoinInfo('eth', function (err, feeInfo) {
                if (err) {
                    console.log('coins - error - eth - db.getCoinInfo - ' + err);
                    lib.log('error', 'coins - eth - db.getCoinInfo - ' + err);
                    return callback(err);
                }

                var minerFee = parseFloat(feeInfo.miner_fee);
                var siteFee = parseFloat(feeInfo.site_fee);
                eth_client.eth.getAccounts(function (err, accounts) {
                    if (err) {
                        console.log('coins - error - eth - eth.getAccounts - ' + err);
                        lib.log('error', 'coins - eth - eth.getAccounts - ' + err);
                        return callback(err);
                    }

                    console.log('coins - success - eth - eth.getAccounts - accounts.length : ' + accounts.length);
                    lib.log('success', 'coins - eth - eth.getAccounts - accounts.length : ' + accounts.length);

                    var accountToBalance = [];
                    var tasks = [];
                    accounts.forEach(function (account, index) {
                        tasks.push(function (callback) {
                            eth_client.eth.getBalance(account, function (err, balance) {
                                if (err) return callback(err);
                                accountToBalance[index] = {};
                                accountToBalance[index].account = account;
                                if (balance > 0) {
                                    accountToBalance[index].balance = (balance - minerFee * 1e18);
                                } else {
                                    accountToBalance[index].balance = balance;
                                }

                                return callback(null);
                            });
                        });
                    });

                    async.series(tasks, function (err) {
                        if (err) { return callback(err); }

                        // sorting
                        for (var nIdX = 0; nIdX < accounts.length - 1; nIdX++) {
                            for (var nIdY = nIdX + 1; nIdY < accounts.length; nIdY++) {
                                if (accountToBalance[nIdY].balance > accountToBalance[nIdX].balance) {
                                    var tempAccount = accountToBalance[nIdX].account;
                                    var tempBalance = accountToBalance[nIdX].balance;
                                    accountToBalance[nIdX].account = accountToBalance[nIdY].account;
                                    accountToBalance[nIdX].balance = accountToBalance[nIdY].balance;
                                    accountToBalance[nIdY].account = tempAccount;
                                    accountToBalance[nIdY].balance = tempBalance;
                                }
                            }
                        }

                        // accounts info
                        for (var nId = 0; nId < accounts.length; nId++) {
                            console.log('accountToBalance[' + nId + '] : ' + accountToBalance[nId].account + '   : balance : ' + accountToBalance[nId].balance / 1e18);
                        }

                        // send
                        amount -= siteFee;
                        amount = parseInt(amount * 1e18);

                        var sendTasks = [];
                        var BreakException = {};
                        try {
                            accountToBalance.forEach(function (account) {
                                if (account.balance >= amount) {
                                    sendTasks.push(function (callback) {
                                        sendETHCoin(account.account, destAddress, amount, true, tableId, callback);
                                    });
                                    throw BreakException;
                                } else {
                                    sendTasks.push(function (callback) {
                                        sendETHCoin(account.account, destAddress, account.balance, false, tableId, callback);
                                    });

                                    amount -= account.balance;
                                }
                            });
                        } catch (e) {
                            if (e !== BreakException) throw e;
                        }

                        async.series(sendTasks, function (err, hash) {
                            if (err) { return callback(err); }
                            return callback(null, hash);
                        });
                    });
                });
            });
        }
    });
};
exports.sendCoin = sendCoin;

/**
 * @created : 20180703
 * @author : WRT
 * @description : get balance information for each coin
 * @param : coin short name
 * @return : { totalFee, sendableBalance, totalBalance }
 */
var getBalanceInfo = function (coinShortName, callback) {
    if (coinShortName === 'btc') {
        // ********************************************************************************************* Bitcoin : BTC : getBalanceInfo *******************************************************************
        btc_client.getBalance(function (err, totalBalance) {
            if (err) {
                console.log('coins - error - btc - btc_client.getBalance - ' + err);
                lib.log('error', 'coins - btc - btc_client.getBalance - ' + err);
                return callback(err);
            }

            console.log('coins - success - btc - btc_client.getBalance - totalBalance : ' + totalBalance);
            lib.log('success', 'coins - btc - btc_client.getBalance - totalBalance : ' + totalBalance);

            totalBalance = parseFloat(totalBalance);

            calcBTCFee(function (err, fee) {
                if (err) {
                    console.log('coins - error - btc - self.calcFee - ' + err);
                    lib.log('error', 'coins - btc - self.calcFee - ' + err);
                    return callback(err);
                }

                console.log('coins - success - btc - self.calcFee - fee : ' + fee);
                lib.log('success', 'coins - btc - self.calcFee - fee : ' + fee);

                var sendableBalance = totalBalance - fee;

                return callback(null, { totalFee: fee, sendableBalance: sendableBalance, totalBalance: totalBalance });
            });
        });
    } else if (coinShortName === 'eth') {
        // ********************************************************************************************* Ethereum : ETH : getBalanceInfo *******************************************************************
        db.getCoinInfo('eth', function (err, feeInfo) {
            if (err) {
                console.log('coins - error - eth - db.getCoinInfo - ' + err);
                lib.log('error', 'coins - eth - db.getCoinInfo - ' + err);
                return callback(err);
            }

            var minerFee = parseFloat(feeInfo.miner_fee);
            var siteFee = parseFloat(feeInfo.site_fee);

            console.log('coins - success - eth - db.getCoinInfo - miner_fee:' + minerFee + '   site_fee:' + siteFee);
            lib.log('success', 'coins - eth - db.getCoinInfo - miner_fee:' + minerFee + '   site_fee:' + siteFee);

            eth_client.eth.getAccounts(function (err, accounts) {
                if (err) {
                    console.log('coins - error - eth - eth.getAccounts - ' + err);
                    lib.log('error', 'coins - eth - eth.getAccounts - ' + err);
                    return callback(err);
                }

                console.log('coins - success - eth - eth.getAccounts - accounts.length : ' + accounts.length);
                lib.log('success', 'coins - eth - eth.getAccounts - accounts.length : ' + accounts.length);

                var tasks = [];
                var totalBalance = 0;
                var totalFee = 0;
                accounts.forEach(function (account) {
                    tasks.push(function (callback) {
                        eth_client.eth.getBalance(account, function (err, balance) {
                            if (err) return callback(err);
                            if (balance > 0) {
                                balance /= 1e18;
                                totalBalance += balance;
                                totalFee += minerFee;
                            }

                            return callback(null);
                        });
                    });
                });

                async.series(tasks, function (err) {
                    if (err) { return callback(err); }

                    totalFee += siteFee;
                    var sendableBalance = totalBalance - totalFee;

                    return callback(null, {totalFee: totalFee, sendableBalance: sendableBalance, totalBalance: totalBalance});
                });
            });
        });
    }
};
exports.getBalanceInfo = getBalanceInfo;

/**
 * @created : 20180625
 * @author : WRT
 * @description : get a total approximate fee for bitcoin : including miner_fee and site_fee
 * @return : fee
 */
var calcBTCFee = function (callback) {
    btc_client.listReceivedByAddress(function (err, addresses) {
        if (err) {
            console.log('coins - error - btc - btc_client.listReceivedByAddress - ' + err);
            lib.log('error', 'coins - btc - btc_client.listReceivedByAddress - ' + err);
            return callback(err);
        }

        console.log('coins - success - btc - btc_client.listReceivedByAddress');
        lib.log('success', 'coins - btc - btc_client.listReceivedByAddress');

        var nCnt = addresses.length;
        db.getCoinInfo('btc', function (err, feeInfo) {
            if (err) {
                console.log('coins - error - btc - db.getCoinInfo - ' + err);
                lib.log('error', 'coins - btc - db.getCoinInfo - ' + err);
                return callback(err);
            }

            var minerFee = parseFloat(feeInfo.miner_fee);
            var siteFee = parseFloat(feeInfo.site_fee);

            var fee = nCnt * minerFee + siteFee;
            return callback(null, fee);
        });
    });
};

/**
 * @created : 20180629
 * @author : WRT
 * @description : calculate amount to be sent
 * @return : amount to be sent
 */
exports.calcRatedReceiveAmount = function (depositCoinName, sendCoinName, depositAmount, callback) {
    db.getCoinInfo(depositCoinName, function (err, depositCoinInfo) {
        if (err) {
            console.log('calcRatedSendAmount - ', err);
            return callback(err);
        }

        db.getCoinInfo(sendCoinName, function (err, sendCoinInfo) {
            if (err) {
                console.log('calcRatedSendAmount - ', err);
                return callback(err);
            }

            var depositPrice = depositCoinInfo.price;
            var sendPrice = sendCoinInfo.price;

            depositPrice = parseFloat(depositPrice);
            sendPrice = parseFloat(sendPrice);
            var ratedSendAmount = depositAmount * depositPrice / sendPrice;

            return callback(null, ratedSendAmount);
        });
    });
};

/**
 * @created : 20180703
 * @author : WRT
 * @description : get trade base information
 * @return : deposit min:max, fee, rate
 */
exports.getBaseInfo = function (depositCoinName, sendCoinName, callback) {
    db.getCoinInfo(depositCoinName, function (err, depositCoinInfo) {
        if (err) {
            console.log('calcDepositRange - ', err);
            return callback(err);
        }

        db.getCoinInfo(sendCoinName, function (err, sendCoinInfo) {
            if (err) {
                console.log('calcDepositRange - ', err);
                return callback(err);
            }

            var depositPrice = depositCoinInfo.price;
            var sendPrice = sendCoinInfo.price;

            depositPrice = parseFloat(depositPrice);
            sendPrice = parseFloat(sendPrice);

            getBalanceInfo(sendCoinName, function (err, balanceInfo) {
                if (err) {
                    console.log('calcDepositRange - ', err);
                    return callback(err);
                }

                var minDeposit = balanceInfo.totalFee * sendPrice / depositPrice;
                var maxDeposit = balanceInfo.sendableBalance * sendPrice / depositPrice;
                var minerFee = balanceInfo.totalFee;
                var rate = depositPrice / sendPrice;

                var depCoin = depositCoinName.toUpperCase();
                var sendCoin = sendCoinName.toUpperCase();

                var minString = minDeposit.toFixed(8) + depCoin;
                var maxString = maxDeposit.toFixed(8) + depCoin;
                var feeString = minerFee.toFixed(8) + sendCoin;
                var rateString = '1' + depCoin + '=' + rate.toFixed(8) + sendCoin;

                return callback(null, {minDeposit: minDeposit, maxDeposit: maxDeposit, minerFee: minerFee, rate: rate, minString: minString, maxString: maxString, feeString: feeString, rateString: rateString});
            });
        });
    });
};

/**
 * @created : 20180704
 * @author : WRT
 * @description : refund
 * @return : deposit min:max, fee, rate
 */
exports.refund = function (depositCoinName, depositAmount, refundAddress, tableId, callback) {
    getBalanceInfo(depositCoinName, function (err, balanceInfo) {
        if (err) {
            console.log('refund - ', err);
            return callback(err);
        }

        var totalFee = balanceInfo.totalFee;
        var refundAmount = depositAmount - totalFee;

        sendCoin(depositCoinName, refundAddress, refundAmount, tableId, function (err, txHash) {
            if (err) {
                console.log('refund - ', err);
                return callback(err);
            }

            db.saveRefundTxHash(tableId, txHash, function (err) {
                if (err) {
                    console.log('refund - db.saveRefundTxHash - ', err);
                    return callback(err);
                }

                db.updateState(tableId, 0, function (err) {
                    if (err) return callback(err);
                    return callback(null);
                });
            });
        });
    });
};
