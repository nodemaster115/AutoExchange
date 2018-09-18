$(document).ready(function () {
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

    $.plot($('#ae_trade_flotcharts_quantity'), chart_quantity_data, {
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

    $.plot($('#ae_trade_flotcharts_value'), chart_value_data, {
        series: {
            pie: {
                show: true
            }
        }
    });

    setInterval(checkStatus, 2000);
});

// check status
var checkStatus = function () {
    $.post('/checkStatus', {
        orderId: orderId
    }, function (result) {
        if (result.status === 'AWAITING_DEPOSIT') {

        } else if (result.status === 'AWAITING_EXCHANGE') {
            $('#ae-trade-tx-download-awaiting').removeClass('ae-trade-pad-middle-current');
            $('#ae-trade-div-tx-awaiting').removeClass('ae-trade-pad-middle-current');
            $('#ae-trade-tx-check-awaiting').removeClass('ae-trade-check-inprogress');
            $('#ae-trade-tx-check-awaiting').addClass('ae-trade-check-finish');
            $('#ae-trade-tx-exchange-exchange').addClass('ae-trade-pad-middle-current');
            $('#ae-trade-div-tx-div-exchange').addClass('ae-trade-pad-middle-current');
        } else if (result.status === 'ALL_DONE') {
            $('#ae-trade-tx-exchange-exchange').removeClass('ae-trade-pad-middle-current');
            $('#ae-trade-div-tx-div-exchange').removeClass('ae-trade-pad-middle-current');
            document.getElementById('ae-trade-div-tx-div-exchange').style.color = '#ffffff';
            document.getElementById('ae-trade-tx-exchange-exchange').style.color = '#ffffff';
            document.getElementById('ae-trade-tx-div-done').style.color = '#ffffff';
            document.getElementById('ae-trade-tx-check-done').style.color = '#968eff';
            $('#ae-trade-tx-check-exchange').addClass('ae-trade-check-finish');
        } else if (result.status === 'DB_ERROR') {
            console.log('check_status - db_error');
        } else if (result.status === 'UNKNOWN_ERROR') {
            console.log('check_status - unknown_error');
        }

        var pro = result.step + '%';
        document.getElementById('ae-trade-progressbar').style.width = pro;
    });
};
