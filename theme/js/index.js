/* CONST */
let TYPE_QUICK = 'quick';
let TYPE_PRECISE = 'precise';
let PART_DEPOSIT = 'deposit';
let PART_RECEIVE = 'receive';

/* global */
var g_tradingType = TYPE_QUICK;

var g_depositCoinShortName = null;
var g_depositCoinFullName = null;

var g_receiveCoinShortName = null;
var g_receiveCoinFullName = null;

var g_depositSelectFlag = false;
var g_receiveSelectFlag = false;

var aryCoinsInfo = '';

var g_clickedPart = null; /* 'deposit', 'receive' */

toastr.options = {
    'closeButton': true,
    'debug': false,
    'newestOnTop': true,
    'progressBar': false,
    'positionClass': 'toast-top-right',
    'preventDuplicates': false,
    'onclick': null,
    'showDuration': '300',
    'hideDuration': '1000',
    'timeOut': '5000',
    'extendedTimeOut': '1000',
    'showEasing': 'swing',
    'hideEasing': 'linear',
    'showMethod': 'fadeIn',
    'hideMethod': 'fadeOut'
};

$(document).ready(function () {
    /***
     * created : 20180622
     * author : WRT
     * description : select coin and close modal dialog
     */
    $('.ae-sel-modal-wrapper').click(function () {
        var strShortName = $(this).find('.ae-sel-modal-coin-short-name').text();
        strShortName = strShortName.toLowerCase();
        var strFullName = $(this).find('.ae-sel-modal-coin-full-name').text();

        $('#id_btnCloseModal').click();

        var strCoinImagePath = '/img/coins/' + strShortName + '.png';
        if (g_clickedPart === PART_DEPOSIT) {
            $('#id_imgDepositCoin').attr('src', strCoinImagePath);
            $('#id_DepositCoinName').text(strFullName);

            g_depositCoinShortName = strShortName;
            g_depositCoinFullName = strFullName;
            g_depositSelectFlag = true;
        } else {
            $('#id_imgReceiveCoin').attr('src', strCoinImagePath);
            $('#id_ReceiveCoinName').text(strFullName);

            g_receiveCoinShortName = strShortName;
            g_receiveCoinFullName = strFullName;
            g_receiveSelectFlag = true;
        }
    });

    /***
     * created : 20180622
     * author : WRT
     * description : set global variables
     */
    $('#id_selectDeposit').click(function () {
        g_clickedPart = PART_DEPOSIT;
    });

    $('#id_selectReceive').click(function () {
        g_clickedPart = PART_RECEIVE;
    });

    $('#id_btnQuick').click(function () {
        g_tradingType = TYPE_QUICK;

        $('#id_btnPrecise').removeClass('ae-index-btn-type-selected');
        $('#id_btnQuick').addClass('ae-index-btn-type-selected');
    });

    $('#id_btnPrecise').click(function () {
        g_tradingType = TYPE_PRECISE;

        $('#id_btnQuick').removeClass('ae-index-btn-type-selected');
        $('#id_btnPrecise').addClass('ae-index-btn-type-selected');
    });

    /***
     * created : 20180622
     * author : WRT
     * description : continue to prepare steop
     */
    $('#id_btnContinue').click(function () {
        if (g_depositCoinShortName === null ||
            g_depositCoinFullName === null ||
            g_receiveCoinShortName === null ||
            g_receiveCoinFullName === null) {
            toastr.info('Select deposit & receive coins and type');
            return;
        }
        $('#id_postDepositCoinShortName').val(g_depositCoinShortName);
        $('#id_postDepositCoinFullName').val(g_depositCoinFullName);
        $('#id_postReceiveCoinShortName').val(g_receiveCoinShortName);
        $('#id_postReceiveCoinFullName').val(g_receiveCoinFullName);
        $('#id_postTradingType').val(g_tradingType);
        $('#id_formPost').submit();
    });

    // show transaction quantify of coin.
    var chart_quantity_data = [];
    var nCount = 3;
    var strList = [];
    strList[0] = 'BTC TO ETH';
    strList[1] = 'ETH TO QRL';
    strList[2] = 'BTC TO QRL';

    for (var i = 0; i < nCount; i++) {
        chart_quantity_data[i] = {
            label: strList[i],
            data: Math.floor(Math.random() * 100) + 1
        };
    }

    $.plot($('#ae_index_flotcharts_quantity'), chart_quantity_data, {
        series: {
            pie: {
                show: true
            }
        }
    });

    // show transaction value of coin
    var chart_value_data = [];

    for (var i = 0; i < nCount; i++) {
        chart_value_data[i] = {
            label: strList[i],
            data: Math.floor(Math.random() * 100) + 1
        };
    }

    $.plot($('#ae_index_flotcharts_value'), chart_value_data, {
        series: {
            pie: {
                show: true
            }
        }
    });

    setInterval(changeImageDeposit, 3000);
    setTimeout(function () {
        setInterval(changeImageReceive, 3000);
    }, 1500);

    getPriceInfo();
    setInterval(getPriceInfo, 3000);
});

var aryDepositFlag = new Array();
aryDepositFlag['BTC'] = false;
aryDepositFlag['ETH'] = false;
aryDepositFlag['QRL'] = false;

function changeImageDeposit () {
    if (!g_depositSelectFlag) {
        var nCheckLength = aryCoinsInfo.length;
        if (nCheckLength == 0) {
            $.post('/getCoinsInfo',
                {

                },
                function (result) {
                    if (result.status == 'success') {
                        aryCoinsInfo = result.msg;
                        var nLength = aryCoinsInfo.length;
                        var flag = false;
                        for (var i = 0; i < nLength; i++) {
                            if (aryDepositFlag[aryCoinsInfo[i].short_name]) {
                                var urlPath = '/img/coins/';
                                var currentCoinShortName = aryCoinsInfo[i].short_name;
                                var currentCoinFullName = aryCoinsInfo[i].full_name;
                                urlPath = urlPath + currentCoinShortName.toLowerCase() + '.png';
                                $('#id_imgDepositCoin').attr('src', urlPath);
                                $('#id_DepositCoinName').text(currentCoinFullName);
                                aryDepositFlag[aryCoinsInfo[i].short_name] = !aryDepositFlag[aryCoinsInfo[i].short_name];
                                var j = i + 1;
                                if (i == (nLength - 1)) {
                                    j = 0;
                                }
                                aryDepositFlag[aryCoinsInfo[j].short_name] = !aryDepositFlag[aryCoinsInfo[j].short_name];
                                flag = true;
                                break;
                            }
                        }
                        if (!flag) {
                            var urlPath = '/img/coins/';
                            var currentCoinShortName = aryCoinsInfo[0].short_name;
                            var currentCoinFullName = aryCoinsInfo[0].full_name;
                            urlPath = urlPath + currentCoinShortName.toLowerCase() + '.png';
                            $('#id_imgDepositCoin').attr('src', urlPath);
                            $('#id_DepositCoinName').text(currentCoinFullName);
                            aryDepositFlag[aryCoinsInfo[0].short_name] = !aryDepositFlag[aryCoinsInfo[0].short_name];
                        }
                    } else {
                        alert(result.msg);
                    }
                });
        } else {
            var depositFlag = false;
            for (var i = 0; i < nCheckLength; i++) {
                if (aryDepositFlag[aryCoinsInfo[i].short_name]) {
                    var urlPath = '/img/coins/';
                    var currentCoinShortName = aryCoinsInfo[i].short_name;
                    var currentCoinFullName = aryCoinsInfo[i].full_name;
                    urlPath = urlPath + currentCoinShortName.toLowerCase() + '.png';
                    $('#id_imgDepositCoin').attr('src', urlPath);
                    $('#id_DepositCoinName').text(currentCoinFullName);
                    if (aryDepositFlag[aryCoinsInfo[i].short_name]) {
                        aryDepositFlag[aryCoinsInfo[i].short_name] = !aryDepositFlag[aryCoinsInfo[i].short_name];
                        var j = i + 1;
                        if (i == (nCheckLength - 1)) {
                            j = 0;
                        }
                        aryDepositFlag[aryCoinsInfo[j].short_name] = !aryDepositFlag[aryCoinsInfo[j].short_name];
                        depositFlag = true;
                        break;
                    }
                }
            }
            if (!depositFlag) {
                var urlPath = '/img/coins/';
                var currentCoinShortName = aryCoinsInfo[0].short_name;
                var currentCoinFullName = aryCoinsInfo[0].full_name;
                urlPath = urlPath + currentCoinShortName.toLowerCase() + '.png';
                $('#id_imgDepositCoin').attr('src', urlPath);
                $('#id_DepositCoinName').text(currentCoinFullName);
                aryDepositFlag[aryCoinsInfo[0].short_name] = !aryDepositFlag[aryCoinsInfo[0].short_name];
            }
        }
    }
}

var aryReceiveFlag = new Array();
aryReceiveFlag['BTC'] = false;
aryReceiveFlag['ETH'] = false;
aryReceiveFlag['QRL'] = false;

function changeImageReceive () {
    if (!g_receiveSelectFlag) {
        var nCheckLength = aryCoinsInfo.length;
        if (nCheckLength == 0) {
            $.post('/getCoinsInfo',
                {

                },
                function (result) {
                    if (result.status == 'success') {
                        aryCoinsInfo = result.msg;
                        var nLength = aryCoinsInfo.length;
                        var receiveFlag = false;
                        for (var i = 0; i < nLength; i++) {
                            if (aryReceiveFlag[aryCoinsInfo[i].short_name]) {
                                var urlPath = '/img/coins/';
                                var currentCoinShortName = aryCoinsInfo[i].short_name;
                                var currentCoinFullName = aryCoinsInfo[i].full_name;
                                urlPath = urlPath + currentCoinShortName.toLowerCase() + '.png';
                                $('#id_imgReceiveCoin').attr('src', urlPath);
                                $('#id_ReceiveCoinName').text(currentCoinFullName);
                                aryReceiveFlag[aryCoinsInfo[i].short_name] = !aryReceiveFlag[aryCoinsInfo[i].short_name];
                                var j = i + 1;
                                if (i == (nLength - 1)) {
                                    j = 0;
                                }
                                aryReceiveFlag[aryCoinsInfo[j].short_name] = !aryReceiveFlag[aryCoinsInfo[j].short_name];
                                receiveFlag = true;
                                break;
                            }
                        }
                        if (!receiveFlag) {
                            var urlPath = '/img/coins/';
                            var currentCoinShortName = aryCoinsInfo[1].short_name;
                            var currentCoinFullName = aryCoinsInfo[1].full_name;
                            urlPath = urlPath + currentCoinShortName.toLowerCase() + '.png';
                            $('#id_imgReceiveCoin').attr('src', urlPath);
                            $('#id_ReceiveCoinName').text(currentCoinFullName);
                            aryReceiveFlag[aryCoinsInfo[1].short_name] = !aryReceiveFlag[aryCoinsInfo[1].short_name];
                        }
                    } else {
                        alert(result.msg);
                    }
                });
        } else {
            var receiveFlag = false;
            for (var i = 0; i < nCheckLength; i++) {
                if (aryReceiveFlag[aryCoinsInfo[i].short_name]) {
                    var urlPath = '/img/coins/';
                    var currentCoinShortName = aryCoinsInfo[i].short_name;
                    var currentCoinFullName = aryCoinsInfo[i].full_name;
                    urlPath = urlPath + currentCoinShortName.toLowerCase() + '.png';
                    $('#id_imgReceiveCoin').attr('src', urlPath);
                    $('#id_ReceiveCoinName').text(currentCoinFullName);
                    aryReceiveFlag[aryCoinsInfo[i].short_name] = !aryReceiveFlag[aryCoinsInfo[i].short_name];
                    var j = i + 1;
                    if (i == (nCheckLength - 1)) {
                        j = 0;
                    }
                    aryReceiveFlag[aryCoinsInfo[j].short_name] = !aryReceiveFlag[aryCoinsInfo[j].short_name];
                    receiveFlag = true;
                    break;
                }
            }
            if (!receiveFlag) {
                var urlPath = '/img/coins/';
                var currentCoinShortName = aryCoinsInfo[1].short_name;
                var currentCoinFullName = aryCoinsInfo[1].full_name;
                urlPath = urlPath + currentCoinShortName.toLowerCase() + '.png';
                $('#id_imgReceiveCoin').attr('src', urlPath);
                $('#id_ReceiveCoinName').text(currentCoinFullName);
                aryReceiveFlag[aryCoinsInfo[1].short_name] = !aryReceiveFlag[aryCoinsInfo[1].short_name];
            }
        }
    }
}

/* save value of previous status */
var btc_flag = false;
var eth_flag = false;
var qrl_flag = false;

function getPriceInfo () {
    $.post('/getPriceInfo',
        {

        },
        function (result) {
            if (result.status == 'failed') {
                toastr.info(result.msg);
            } else {
                var aryData = result.msg;
                var nLength = aryData.length;

                var oldbtcvalue = $('#btc_value').text();
                var oldethvalue = $('#eth_value').text();
                var oldqrlvalue = $('#qrl_value').text();

                var newbtcvalue = aryData[0].price;
                var newethvalue = aryData[1].price;
                var newqrlvalue = aryData[2].price;
                if (oldbtcvalue != newbtcvalue) {
                    if ($('.color-background-green').length > 0) {
                        $('#btc_status').removeClass('color-background-green');
                        $('#btc_status').addClass('color-background-red');
                        btc_flag = false;
                    } else if ($('.color-background-red').length <= 0) {
                        $('#btc_status').addClass('color-background-red');
                        btc_flag = false;
                    }
                } else {
                    if ($('.color-background-green').length > 0) {
                        $('#btc_status').removeClass('color-background-green');
                        btc_flag = true;
                    } else {
                        if ($('.color-background-red').length > 0) {
                            $('#btc_status').removeClass('color-background-red');
                            $('#btc_status').addClass('color-background-green');
                            btc_flag = false;
                        } else {
                            if (!btc_flag) {
                                $('#btc_status').addClass('color-background-green');
                            }
                        }
                    }
                }
                if (oldethvalue != newethvalue) {
                    if ($('.color-background-green').length > 0) {
                        $('#eth_status').removeClass('color-background-green');
                        $('#eth_status').addClass('color-background-red');
                    } else if ($('.color-background-red').length <= 0) {
                        $('#eth_status').addClass('color-background-red');
                    }
                    eth_flag = false;
                } else {
                    if ($('.color-background-green').length > 0) {
                        $('#eth_status').removeClass('color-background-green');
                        eth_flag = true;
                    } else {
                        if ($('.color-background-red').length > 0) {
                            $('#eth_status').removeClass('color-background-red');
                            $('#eth_status').addClass('color-background-green');
                            eth_flag = false;
                        } else {
                            if (!eth_flag) {
                                $('#eth_status').addClass('color-background-green');
                            }
                        }
                    }
                }

                if (oldqrlvalue != newqrlvalue) {
                    if ($('.color-background-green').length > 0) {
                        $('#qrl_status').removeClass('color-background-green');
                        $('#qrl_status').addClass('color-background-red');
                    } else if ($('.color-background-red').length <= 0) {
                        $('#qrl_status').addClass('color-background-red');
                    }
                    qrl_flag = false;
                } else {
                    if ($('.color-background-green').length > 0) {
                        $('#qrl_status').removeClass('color-background-green');
                        qrl_flag = true;
                    } else {
                        if ($('.color-background-red').length > 0) {
                            $('#qrl_status').removeClass('color-background-red');
                            $('#qrl_status').addClass('color-background-green');
                            qrl_flag = false;
                        } else {
                            if (!qrl_flag) {
                                $('#qrl_status').addClass('color-background-green');
                            }
                        }
                    }
                }

                $('#btc_percent').text(aryData[0].cap24hrchange);
                $('#eth_percent').text(aryData[1].cap24hrchange);
                $('#qrl_percent').text(aryData[2].cap24hrchange);

                $('#btc_value').text(aryData[0].price);
                $('#eth_value').text(aryData[1].price);
                $('#qrl_value').text(aryData[2].price);
            }
        });
}
