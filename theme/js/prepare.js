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

var g_clickedPart = null; /* 'deposit', 'receive' */

var g_chkAgree = false;
var g_rate = null;

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
    init();
    function init () {
        g_tradingType = $('#id_postTradingType').val();
        g_depositCoinShortName = $('#id_postDepositCoinShortName').val();
        g_depositCoinFullName = $('#id_postDepositCoinFullName').val();
        g_receiveCoinShortName = $('#id_postReceiveCoinShortName').val();
        g_receiveCoinFullName = $('#id_postReceiveCoinFullName').val();

        updateBaseInfo();
        updateStringInfo();
        setCoinImage();
    }

    function setCoinImage () {
        let strDepositCoinShortName = g_depositCoinShortName.toLowerCase();
        var strDepositCoinImagePath = '/img/coins/' + strDepositCoinShortName + '.png';
        $('#id_imgDepositCoin').attr('src', strDepositCoinImagePath);
        $('#id_DepositCoinName').text(g_depositCoinFullName);

        let strReceiveCoinShortName = g_receiveCoinShortName.toLowerCase();
        var strReceiveCoinImagePath = '/img/coins/' + strReceiveCoinShortName + '.png';
        $('#id_imgReceiveCoin').attr('src', strReceiveCoinImagePath);
        $('#id_ReceiveCoinName').text(g_receiveCoinFullName);
    }

    function updateBaseInfo () {
        $.post('/getBaseInfo', {
            depositCoin: g_depositCoinShortName,
            receiveCoin: g_receiveCoinShortName
        }, function (result) {
            console.log('getBaseInfo : ', result);

            if (result.status === 'success') {
                $('#id_rateString').html(result.baseInfo.rateString);
                $('#id_minString').html(result.baseInfo.minString);
                $('#id_maxString').html(result.baseInfo.maxString);
                $('#id_feeString').html(result.baseInfo.feeString);
                g_rate = result.baseInfo.rate;
            }
        });
    }

    function updateStringInfo () {
        var strDestPlaceholder = 'Your ' + g_receiveCoinFullName + ' Address (destination address)';
        var strRefundPlaceholder = 'Your ' + g_depositCoinFullName + ' Refund Address';
        $('#id_destAddress').attr('placeholder', strDestPlaceholder);
        $('#id_refundAddress').attr('placeholder', strRefundPlaceholder);
    }

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
        } else {
            $('#id_imgReceiveCoin').attr('src', strCoinImagePath);
            $('#id_ReceiveCoinName').text(strFullName);

            g_receiveCoinShortName = strShortName;
            g_receiveCoinFullName = strFullName;
        }
    });

    $('#id_chkAgree').mouseup(function () {
        if (g_chkAgree === false) {
            g_chkAgree = true;
        } else {
            g_chkAgree = false;
        }
    });

    $('#id_depositAmount').keyup(function () {
        var depositAmount = $('#id_depositAmount').val();
        if (depositAmount === '') {
            $('#id_receiveAmount').val('');
            return;
        }
        depositAmount = parseFloat(depositAmount);
        if (isNaN(depositAmount)) {
            toastr.info('Input deposit amount correctly.');
            return;
        }

        if (g_rate === null) {
            toastr.info('Can\'t get basic information');
            return;
        }

        var receiveAmount = depositAmount * g_rate;
        receiveAmount = receiveAmount.toFixed(8);
        $('#id_receiveAmount').val(receiveAmount);
    });

    $('#id_receiveAmount').keyup(function () {
        var receiveAmount = $('#id_receiveAmount').val();
        if (receiveAmount === '') {
            $('#id_depositAmount').val('');
            return;
        }
        receiveAmount = parseFloat(receiveAmount);
        if (isNaN(receiveAmount)) {
            toastr.info('Input receive amount correctly.');
            return;
        }

        if (g_rate === null) {
            toastr.info('Can\'t get basic information');
            return;
        }

        var depositAmount = receiveAmount / g_rate;
        depositAmount = depositAmount.toFixed(8);
        $('#id_depositAmount').val(depositAmount);
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

    $('#id_selectExchange').click(function () {
        let strTempShort = g_depositCoinShortName;
        let strTempFull = g_depositCoinFullName;
        g_depositCoinShortName = g_receiveCoinShortName;
        g_depositCoinFullName = g_receiveCoinFullName;
        g_receiveCoinShortName = strTempShort;
        g_receiveCoinFullName = strTempFull;

        updateBaseInfo();
        updateStringInfo();
        setCoinImage();
    });

    /***
     * created : 20180622
     * author : WRT
     * description : continue to prepare steop
     */
    $('#id_btnStartTransaction').click(function () {
        if (g_depositCoinShortName === null ||
            g_depositCoinFullName === null ||
            g_receiveCoinShortName === null ||
            g_receiveCoinFullName === null) {
            toastr.info('Select deposit & receive coins and type');
            return;
        }

        var strDestAddress = $('#id_destAddress').val();
        var strRefundAddress = $('#id_refundAddress').val();
        if (strDestAddress == '' || strRefundAddress == '') {
            toastr.info('Input dest & refund address');
            return;
        }

        if (g_tradingType === TYPE_PRECISE) {
            var strDepositAmount = $('#id_depositAmount').val();
            var strReceiveAmount = $('#id_receiveAmount').val();

            if (strDepositAmount == '' || strReceiveAmount == '') {
                toastr.info('Input deposit & receive Amount');
                return;
            }

            $('#id_postDepositAmount').val(strDepositAmount);
            $('#id_postReceiveAmount').val(strReceiveAmount);
        }

        if (g_chkAgree === false) {
            toastr.info('You must agree to the Terms and certify.');
            return;
        }

        $('#id_postDepositCoinShortName').val(g_depositCoinShortName);
        $('#id_postDepositCoinFullName').val(g_depositCoinFullName);
        $('#id_postReceiveCoinShortName').val(g_receiveCoinShortName);
        $('#id_postReceiveCoinFullName').val(g_receiveCoinFullName);
        $('#id_postTradingType').val(g_tradingType);
        $('#id_postDestAddress').val(strDestAddress);
        $('#id_postRefundAddress').val(strRefundAddress);

        $('#id_formPost').submit();
    });

    $('#id_btnBack').click(function () {
        parent.history.back(1);
    });

    // show transaction quantify of coin
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

    $.plot($('#ae_prepare_flotcharts_quantity'), chart_quantity_data, {
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

    $.plot($('#ae_prepare_flotcharts_value'), chart_value_data, {
        series: {
            pie: {
                show: true
            }
        }
    });

    getPriceInfo();
    setInterval(getPriceInfo, 3000);
});

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
