requirejs.config({
    baseUrl: '/scripts', // If no baseUrl is explicitly set in the configuration, the default value will be the location of the HTML page that loads require.js.
    paths: {
        autolinker: '../../node_modules/autolinker/dist/Autolinker',
        classnames: '../../node_modules/classnames/index',
        lodash: '../../node_modules/lodash/index',
        react: '../../node_modules/react/dist/react-with-addons',
        seedrandom: '../../node_modules/seedrandom/seedrandom',
        socketio: '../../node_modules/socket.io-client/socket.io',
        mousetrap: '../../node_modules/mousetrap/mousetrap',
        screenfull: '../../node_modules/screenfull/dist/screenfull'
    },
    shim: {

    }
});

require(['game'], function () {
    var height = null;
    var timer = window.setInterval(is_element_loaded, 10);
    var advertisement_urls = {};

    function is_element_loaded () {
        height = $('#id_divRoundNote').height();
        if (height != null) {
            $('#loading-div').hide();
            window.clearTimeout(timer);
            Metronic.init();
            Layout.init();
            jQuery(document).ready(function () {
                // Metronic.init();
                // Layout.init();

                var languageCode = document.getElementById('id_hiddenLanguageCode').value;

                function isMobileDevice () {
                    return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1);
                };

                //calcLayout();
                // if(!isMobileDevice()) {

                // if(!(screen.width <= 480 && isMobileDevice())) {
                //     $(window).resize(function () {
                //         console.log('resize layout - main');
                //         calcLayout();
                //     });
                // }

                $('#chatModal').draggable();

                $('#chatModal .modal-content').resizable({
                    alsoResize: '#chatModal .modal-dialog, #chatModal .scroller, #chatModal .slimScrollDiv, #chatModal',
                    minHeight: 150,
                    minWidth: 400,
                    resize: function (event, ui) {
                        var height = ui.size.height;
                        var width = ui.size.width;
                        $(this).find('#chatModal .scroller').css('width', (width - 20) + 'px');
                        $(this).find('#chatModal .slimScrollDiv').css('width', (width - 20) + 'px');
                        $(this).find('#chatModal .slimScrollDiv').css('height', (height - 110) + 'px');
                        $('#chatModal').css('padding-left', 0);
                    }
                });

                $('#chat_modal_button').click(function () {
                    onSidebarLiElement(this);
                });

                $('#close_chat_button').click(function () {
                    onCloseModal('chat');
                });

                $(document).on('click', '#id_linkLogout', function () {
                    if (document.getElementById('logout')) {
                        if(languageCode == 'zh')
                            bootbox.setDefaults("locale", 'zh_CN');
                        bootbox.confirm({
                            size: "small",
                            message:  confirmString,
                            callback: function(result){
                                if(result)
                                    document.getElementById('logout').submit();
                            }
                        });

                        // if (confirm(confirmString)) {
                        //     document.getElementById('logout').submit();
                        // }
                    }
                });

                $(document).on('click', '#id_linkLogout_sidebar', function () {
                    if (document.getElementById('logout')) {
                        if(languageCode == 'zh')
                            bootbox.setDefaults("locale", 'zh_CN');
                        bootbox.confirm({
                            size: "small",
                            message:  confirmString,
                            callback: function(result){
                                if(result)
                                    document.getElementById('logout').submit();
                            }
                        });
                        // if (confirm(confirmString)) {
                        //     document.getElementById('logout').submit();
                        // }
                    }
                });
                //======================= Hash Copy Clipboard =======================
                var clipboard = new ClipboardJS('.hash-copy-cont');

                clipboard.on('success', function(e) {
                    if(languageCode == 'en') {
                        toastr['success']("Copy address completed.");
                    } else {
                        toastr['success']("已经复制好了。");
                    }
                    // console.log(e);
                });

                clipboard.on('error', function(e) {
                    if(languageCode == 'en') {
                        toastr['warning']("Copy address failed.");
                    } else {
                        toastr['warning']('failed');
                    }
                    // console.log(e);
                });

                //======================= Start Advertisement =======================

                $.post('/getAdvertisementUrl', function (data, status) {
                    if (status == 'success') {
                        if (data.length != 0) { advertisement_urls = data.url; }
                    } else {
                        alert(alert4String);
                    }
                });

                $(document).on('click', '.menu-toggler.responsive-toggler', function () {
                    // if($(".navbar-collapse").attr('aria-expanded') == 'true')
                    //     $(".custom-bitcoin-amount-mobile").hide();
                    // else $(".custom-bitcoin-amount-mobile").show();
                });

                $('#id_advertisementContainer > div:gt(0)').hide();

                setInterval(function () {
                    $('#id_advertisementContainer > div:first')
                        .fadeOut(1000)
                        .next()
                        .fadeIn(1000)
                        .end()
                        .appendTo('#id_advertisementContainer');
                }, 3000);

                $(document).on('click', 'body', function (event) {
                    if (event.target.id == 'id_advertisementContainer_before') {
                        $('#id_advertisementContainer').css('right', '0');
                        $('#id_advertisementContainer > div').css('right', '0');
                        $('#id_advertisementContainer_before').css('right', '125px');
                    } else if (event.target.id != 'id_advertisementContainer_before' &&
                        (event.target.id == 'id_imageAdvertisement_1' || event.target.id == 'id_imageAdvertisement_2' || event.target.id == 'id_imageAdvertisement_3')) {
                        if (event.target.id == 'id_imageAdvertisement_1') {
                            window.open(advertisement_urls['advertisement_link_1'], '_blank');
                        } else if (event.target.id == 'id_imageAdvertisement_2') {
                            indow.open(advertisement_urls['advertisement_link_2'], '_blank');
                        } else if (event.target.id == 'id_imageAdvertisement_3') {
                            window.open(advertisement_urls['advertisement_link_3'], '_blank');
                        }
                    } else {
                        $('#id_advertisementContainer').css('right', '-200px');
                        $('#id_advertisementContainer_before').css('right', '-75px');
                        $('#id_advertisementContainer > div').css('right', '-200px');

                    }
                });

                $(document).on('click', '.class_liLanguage', function () {
                    var current_url = window.location.href;
                    var language_code;
                    if ($(this).next().hasClass('class_liLanguage')) { language_code = 'en'; } else language_code = 'zh';
                    $('#id_formSetLanguage').find("[name='current_url']").val(current_url);
                    $('#id_formSetLanguage').find("[name='language_code']").val(language_code);
                    $('#id_formSetLanguage').submit();
                });

                $(document).on('click', '#id_btnLanguageSwitch', function () {
                    var current_url = window.location.href;
                    var language_code = ($('#id_hiddenLanguageCode').val() === 'en' ? 'zh' : 'en');
                    $('#id_formSetLanguage').find("[name='current_url']").val(current_url);
                    $('#id_formSetLanguage').find("[name='language_code']").val(language_code);
                    $('#id_formSetLanguage').submit();
                });

                $(document).on('click', '#id_btnLanguageSwitch2', function () {
                    var current_url = window.location.href;
                    var language_code = ($('#id_hiddenLanguageCode').val() === 'en' ? 'zh' : 'en');
                    $('#id_formSetLanguage').find("[name='current_url']").val(current_url);
                    $('#id_formSetLanguage').find("[name='language_code']").val(language_code);
                    $('#id_formSetLanguage').submit();
                });

                var selectedElement;
                var badgeNumber;

                $(document).on('click', '.delete', function () {
                    selectedElement = $(this);
                    var mail_id = $(this).siblings().first().attr('value');

                    $.post('/delete-mail', {id: mail_id}, function (data, status) {
                        if (status === 'success') {
                            selectedElement.parent().remove();
                            badgeNumber = parseInt($('.badge.badge-danger').text()) - 1;
                            if (badgeNumber <= 0) {
                                $('.reply.dropdown-menu').hide();
                                $('#header_inbox_bar').hide();
                            } else {
                                $('.badge.badge-danger').text(badgeNumber);
                                if (languageCode === 'en') {
                                    $('.bold').text((badgeNumber) + ' New');
                                } else if (languageCode === 'zh') {
                                    $('.bold').text((badgeNumber) + '封新');
                                }
                            }
                        } else {
                            console.log('Status: ' + status + '\nData: ' + data);
                        }
                    });
                });

                $('#header_inbox_bar').click(function () {
                    if ($('#header_inbox_bar').hasClass('open')) {
                        return;
                    }
                    $.post('/get-notifications',
                        {id: user.id},
                        function (data, status) {
                            if (status === 'success' && data.result) {
                                user['reply'] = data.result;

                                var replylist = "<li class='external'>";

                                if (languageCode === 'en') { replylist += "<div><span class='bold'>" + user.reply.length + ' New</span> Messages</div>'; } else if (languageCode === 'zh') { replylist += "<div><span class='bold'>" + user.reply.length + '封新</span>信息</div>'; } else { replylist += "<div><span class='bold'>" + user.reply.length + ' New</span> Messages</div>'; }

                                replylist += '</li>';
                                replylist += '<li>';
                                replylist += "<ul class='dropdown-menu-list scroller' data-handle-color='#637283' style='height:250px; overflow: auto;' data-initialized='1'>";

                                user.reply.forEach(function (row) {
                                    replylist += '<li>';
                                    replylist += "<input type='hidden' value='" + row.id + "'/>";
                                    replylist += "<a class='message' style='border:none!important;'>";
                                    if (row.message_to_user.indexOf('welcome_free_bits:') >= 0) {
                                        var welcome_free_bits = row.message_to_user.substr(18);
                                        replylist += '<p>' + strBonusMessage0 + welcome_free_bits;
                                        if (languageCode === 'zh') replylist += '。</p>';
                                        else replylist += '.</p>';
                                    } else if (row.message_to_user.indexOf('tip_transfer:') >= 0) {
                                        var amount = row.message_to_user.split(' ')[0].substr(13);
                                        var from = row.message_to_user.split(' ')[1].substr(5);
                                        replylist += '<p>' + from + strBonusMessage2 + amount + strBonusMessage3 + '</p>';
                                    } else if (row.message_to_user.indexOf('funding_bonus:') >= 0) {
                                        var amount = row.message_to_user.split(' ')[0].substr(14);
                                        var from = row.message_to_user.split(' ')[1].substr(5);
                                        replylist += '<p>' + strBonusMessage6 + from + strBonusMessage7 + amount + strBonusMessage8 + '</p>';
                                    } else if (row.message_to_user.indexOf('login_bonus:') >= 0) {
                                        var amount = row.message_to_user.split(' ')[0].substr(12);
                                        replylist += '<p>' + strBonusMessage4 + amount + strBonusMessage5 + '</p>';
                                    } else {
                                        replylist += '<p>' + row.message_to_user + '</p>';
                                    }
                                    replylist += '</a>';
                                    replylist += "<a class='delete' style='border:none!important;'>";
                                    replylist += "<i class='fas fa-trash-alt'></i>";
                                    replylist += '</a>';
                                    replylist += '</li>';
                                });

                                replylist += '</ul></li>';

                                $('ul.reply').children().remove();
                                $('ul.reply').append(replylist);
                                $('#header_inbox_bar').addClass('open');
                            } else {
                                console.log('***** Error *****');
                                console.log(data.error);
                            }
                        });
                });
            });

            function onSidebarLiElement (el) {
                if ($(el).hasClass('active') === true) { $(el).removeClass('active'); } else $(el).addClass('active');
            };

            function onCloseModal (val) {
                if (val == 'chat') {
                    $('#chat_modal_button').removeClass('active');
                } else if (val == 'history') {
                    $('#history_modal_button').removeClass('active');
                } else if (val == 'setting') {
                    $('#setting_modal_button').removeClass('active');
                }
            };

            function calcLayout () {
                Metronic.init();
                Layout.init();
                var height = $(window).height();
                var width = $(window).width();
                console.log('width', $(document).width() + "   " + width + "   " + screen.width);
                console.log('height', $(document).height() + "   " + height + "   " + screen.height);
                var headerHeight = $('.page-header').outerHeight();
                height = height - headerHeight;

                if (width <= 480) {
                    var cash_panel_height = 70; // =cash_panel_width
                    var cash_panel_top = 25;
                    var cash_panel_right = (width - cash_panel_height) / 2 + 30;
                    var cash_panel_font = cash_panel_height / 7 * 5;
                    var cash_panel_padding = (cash_panel_height - cash_panel_font) / 7 * 3;
                    $('#id_divPayout').css('height', cash_panel_height + 'px');
                    $('#id_divPayout').css('width', cash_panel_height + 'px');
                    $('#id_divPayout').css('top', cash_panel_top + 'px');
                    $('#id_divPayout').css('right', cash_panel_right + 'px');
                    $('#id_divPayout').css('font-size', cash_panel_font + 'px');
                    $('#id_divPayout').css('padding', cash_panel_padding + 'px 1px');
                    $('#id_divPayout').removeClass('btn-circle-50p');

                    var graph_height = cash_panel_height + 120;
                    $('#id_divChart').css('height', graph_height + 'px');
                    $('#id_divChart').css('width', '125%');
                    $('#id_divChart').css('margin-left', '-8%');

                    var roundNote_height = cash_panel_height;
                    var roundNote_top = cash_panel_top - 20;
                    var roundNote_right = 0;
                    var roundNote_width = width - 50;
                    var roundNote_padding = cash_panel_padding;
                    var roundNote_font = cash_panel_font / 5 * 4;
                    $('#id_divRoundNote').css('height', roundNote_height + 'px');
                    $('#id_divRoundNote').css('top', roundNote_top + 'px');
                    $('#id_divRoundNote').css('right', (roundNote_right + 25) + 'px');
                    $('#id_divRoundNote').css('width', roundNote_width + 'px');
                    $('#id_divRoundNote').css('padding', roundNote_padding + 'px 1px');
                    $('#id_divRoundNote').css('font-size', roundNote_font + 'px');

                    var round_info_height = 200;
                    $('#round_info').css('height', round_info_height + 'px');
                    $('#round_info').parent().css('height', round_info_height + 'px');

                    var tab_content_height = height - graph_height - $('.custom-login-play-btn').height() - 34;
                    $('#play_button_tab_content').css('height', tab_content_height + 'px');
                    $('#play_button_tab_content').parent().css('padding', '0 0 0 40px');
                    $('#play_button_tab_content').parent().parent().css('padding', '0 7px 0 0');

                    $('.button-container').parent().css('padding', '0 20px');

                    $('#tab_chat').find('.scroller').css('height', (tab_content_height - 46) + 'px');
                    $('#tab_chat').find('.slimScrollDiv').css('height', (tab_content_height - 55) + 'px');

                    $('#tab_players').find('.scroller').css('height', (tab_content_height - 23) + 'px');
                    $('#tab_players').find('.slimScrollDiv').css('height', (tab_content_height - 23) + 'px');

                    $('#tab_history').find('.scroller').css('height', (tab_content_height - 23) + 'px');
                    $('#tab_history').find('.slimScrollDiv').css('height', (tab_content_height - 23) + 'px');

                    var maxProfit_right = $('#play_button_tab_content').width() / 100 * 72;
                    var maxProfit_top = -17;
                    $('.max-profit').css('right', maxProfit_right + 'px');
                    $('.max-profit').css('top', maxProfit_top + 'px');

                    $('#id_imgFireworks').css('top', '25px');
                    $('#id_imgFireworks').css('right', (width - 80) + 'px');

                    $(document).on('click', '.custom-tab-menu', function () {
                        if ($(this).attr('name') == 'name_customTab') {
                            setTextareaHeight();
                            function setTextareaHeight () {
                                if ($('#id_textareaCustomScript').css('height') == undefined) { setTimeout(setTextareaHeight, 30); } else $('#id_textareaCustomScript').css('height', (tab_content_height - 60) + 'px');
                            }
                        }
                    });

                    $('.custom-control-tab-li').first().children().click();
                } else if (width <= 780) {
                    var cash_panel_height = 75; // =cash_panel_width
                    var cash_panel_top = 75;
                    var cash_panel_right = (width - cash_panel_height) / 2;
                    var cash_panel_font = cash_panel_height / 7 * 5;
                    var cash_panel_padding = (cash_panel_height - cash_panel_font) / 7 * 3;

                    $('#id_divPayout').css('height', cash_panel_height + 'px');
                    $('#id_divPayout').css('width', cash_panel_height + 'px');
                    $('#id_divPayout').css('top', cash_panel_top + 'px');
                    $('#id_divPayout').css('right', cash_panel_right + 'px');
                    $('#id_divPayout').css('font-size', cash_panel_font + 'px');
                    $('#id_divPayout').css('padding', cash_panel_padding + 'px 1px');
                    $('#id_divPayout').removeClass('btn-circle-50p');

                    var graph_height = cash_panel_height + 200;
                    $('#id_divChart').css('height', graph_height + 'px');
                    $('#id_divChart').css('width', '115%');
                    $('#id_divChart').css('margin-left', '-4%');

                    var roundNote_height = cash_panel_height;
                    var roundNote_top = cash_panel_top;
                    var roundNote_right = 0;
                    var roundNote_width = width - 50;
                    var roundNote_padding = cash_panel_padding;
                    var roundNote_font = cash_panel_font;
                    $('#id_divRoundNote').css('height', roundNote_height + 'px');
                    $('#id_divRoundNote').css('top', roundNote_top + 'px');
                    $('#id_divRoundNote').css('right', (roundNote_right + 25) + 'px');
                    $('#id_divRoundNote').css('width', roundNote_width + 'px');
                    $('#id_divRoundNote').css('padding', roundNote_padding + 'px 1px');
                    $('#id_divRoundNote').css('font-size', roundNote_font + 'px');

                    var round_info_height = 200;
                    $('#round_info').css('height', round_info_height + 'px');
                    $('#round_info').parent().css('height', round_info_height + 'px');

                    var tab_content_height = height - graph_height - 58;
                    $('#play_button_tab_content').css('height', tab_content_height + 'px');
                    $('#play_button_tab_content').parent().css('padding', '0 0 0 40px');
                    $('#play_button_tab_content').parent().parent().css('padding', '0 7px 0 0');

                    $('.button-container').parent().css('padding', '0 20px');

                    $('#tab_chat').find('.scroller').css('height', (tab_content_height - 55) + 'px');
                    $('#tab_chat').find('.slimScrollDiv').css('height', (tab_content_height - 64) + 'px');

                    $('#tab_players').find('.scroller').css('height', (tab_content_height - 23) + 'px');
                    $('#tab_players').find('.slimScrollDiv').css('height', (tab_content_height - 23) + 'px');

                    $('#tab_history').find('.scroller').css('height', (tab_content_height - 23) + 'px');
                    $('#tab_history').find('.slimScrollDiv').css('height', (tab_content_height - 23) + 'px');

                    $(document).on('click', '.custom-tab-menu', function () {
                        if ($(this).attr('name') == 'name_customTab') {
                            setTextareaHeight();
                            function setTextareaHeight () {
                                if ($('#id_textareaCustomScript').css('height') == undefined) { setTimeout(setTextareaHeight, 100); } else $('#id_textareaCustomScript').css('height', (tab_content_height - 60) + 'px');
                            }
                        }
                    });

                    $('.custom-control-tab-li').first().children().click();

                    if ($('#tab_manual').children().eq(0).children().eq(0).hasClass('col-xs-9')) {
                        $('#tab_manual').children().eq(0).children().eq(0).removeClass('col-xs-9').addClass('col-xs-6');
                        $('#tab_manual').children().eq(0).children().eq(1).removeClass('col-xs-3').addClass('col-xs-6');
                    }

                    var maxProfit_right = $('#play_button_tab_content').width() / 100 * 90;
                    var maxProfit_top = -18;
                    $('.max-profit').css('right', maxProfit_right + 'px');
                    $('.max-profit').css('top', maxProfit_top + 'px');

                    $('#id_imgFireworks').css('top', '30px');
                    $('#id_imgFireworks').css('right', (width - 100) + 'px');
                } else if (width <= 1200) {
                    $('.page-sidebar-menu-hover-submenu').parent().attr('style', 'height:' + height + 'px !important');
                    var play_button_tab_content_height = 225;
                    if(width > 992)
                        $('#play_button_tab_content').css('height', play_button_tab_content_height + 'px');

                    var round_info_height = (height - 82) / 2;
                    $('#round_info').css('height', round_info_height + 'px');
                    $('#round_info').parent().css('height', round_info_height + 'px');

                    $('#id_divGamesLog').css('height', round_info_height + 'px');
                    $('#id_divGamesLog').parent().css('height', round_info_height + 'px');

                    var graph_height = height - play_button_tab_content_height - 111;
                    var graph_width = $('#play_button_tab_content').width();

                    $('#id_divChart').css('height', graph_height + 'px');

                    var cash_panel_height = ((graph_height < graph_width) ? (graph_height) : (graph_width)) - 80;
                    $('#id_divPayout').css('height', cash_panel_height + 'px');
                    $('#id_divPayout').css('width', cash_panel_height + 'px');

                    var cash_panel_top = (graph_height - cash_panel_height) / 2 - 10;
                    var cash_panel_right = $('#id_divRecentHistory').width() + ($('#play_button_tab_content').width() - $('#id_divRecentHistory').width()) / 2 - $('#id_divPayout').width() / 2;
                    var cash_panel_font = cash_panel_height / 10 * 3;
                    var cash_panel_padding = (cash_panel_height - cash_panel_font) / 8 * 3;

                    $('#id_divPayout').css('top', cash_panel_top + 'px');
                    $('#id_divPayout').css('font-size', cash_panel_font + 'px');
                    $('#id_divPayout').css('padding', cash_panel_padding + 'px 1px');
                    $('#id_divPayout').css('right', cash_panel_right + 'px');

                    var roundNote_height = cash_panel_height;
                    var roundNote_top = cash_panel_top;
                    var roundNote_right = $('#id_divRecentHistory').width() + 10;
                    var roundNote_width = $('#play_button_tab_content').width() - $('#id_divRecentHistory').width();
                    var roundNote_padding = cash_panel_height / 4;
                    var roundNote_font = (cash_panel_height - cash_panel_font) / 8 * 3;
                    $('#id_divRoundNote').css('height', roundNote_height + 'px');
                    $('#id_divRoundNote').css('top', roundNote_top + 'px');
                    $('#id_divRoundNote').css('right', (roundNote_right + 10) + 'px');
                    $('#id_divRoundNote').css('width', roundNote_width + 'px');
                    $('#id_divRoundNote').css('padding', roundNote_padding + 'px 1px');
                    $('#id_divRoundNote').css('font-size', roundNote_font + 'px');

                    var maxProfit_right = $('#play_button_tab_content').width() / 100 * 85;
                    $('.max-profit').css('right', maxProfit_right + 'px');

                    var recentHistoryPadding = ($('#id_divRecentHistory').find('.scroller').innerWidth() - $('#id_divRecentHistory').find('.scroller').width()) / 2;
                    $('#id_divRecentHistory').find('.scroller').css('padding-left', recentHistoryPadding + 'px');

                    $('#id_imgFireworks').css('top', '100px');
                    $('#id_imgFireworks').css('right', width / 2 - 50 + 'px');

                    $(document).on('click', '.custom-tab-menu', function () {
                        if ($(this).hasClass('custom-tab-menu-custom')) {
                            setTextareaHeight();
                            function setTextareaHeight () {
                                if ($('#id_textareaCustomScript').css('height') == undefined) { setTimeout(setTextareaHeight, 100); } else {
                                    $('#id_textareaCustomScript').css('height', 'auto');
                                    $('.custom-customscript-button').css('margin-top', ($('#id_textareaCustomScript').height() - 60) + 'px', '!important');
                                }
                            }
                        }
                    });
                } else {
                    $('.page-sidebar-menu-hover-submenu').parent().attr('style', 'height:' + height + 'px !important');
                    var play_button_tab_content_height = 225;
                    if(width > 992)
                        $('#play_button_tab_content').css('height', play_button_tab_content_height + 'px');

                    var round_info_height = (height - 82) / 2;
                    $('#round_info').css('height', round_info_height + 'px');
                    $('#round_info').parent().css('height', round_info_height + 'px');

                    $('#id_divGamesLog').css('height', round_info_height + 'px');
                    $('#id_divGamesLog').parent().css('height', round_info_height + 'px');

                    var graph_height = height - play_button_tab_content_height - 111;
                    var graph_width = $('#play_button_tab_content').width();

                    $('#id_divChart').css('height', graph_height + 'px');

                    var cash_panel_height = ((graph_height < graph_width) ? (graph_height) : (graph_width)) - 80;
                    $('#id_divPayout').css('height', cash_panel_height + 'px');
                    $('#id_divPayout').css('width', cash_panel_height + 'px');

                    var cash_panel_top = (graph_height - cash_panel_height) / 2 - 10;
                    var cash_panel_right = $('#id_divRecentHistory').width() + ($('#play_button_tab_content').width() - $('#id_divRecentHistory').width()) / 2 - $('#id_divPayout').width() / 2;
                    var cash_panel_font = cash_panel_height / 10 * 3;
                    var cash_panel_padding = (cash_panel_height - cash_panel_font) / 8 * 3;

                    $('#id_divPayout').css('top', cash_panel_top + 'px');
                    $('#id_divPayout').css('font-size', cash_panel_font + 'px');
                    $('#id_divPayout').css('padding', cash_panel_padding + 'px 1px');
                    $('#id_divPayout').css('right', cash_panel_right + 'px');

                    var roundNote_height = cash_panel_height;
                    var roundNote_top = cash_panel_top;
                    var roundNote_right = $('#id_divRecentHistory').width() + 10;
                    var roundNote_width = $('#play_button_tab_content').width() - $('#id_divRecentHistory').width();
                    var roundNote_padding = cash_panel_height / 4;
                    var roundNote_font = (cash_panel_height - cash_panel_font) / 8 * 3;
                    $('#id_divRoundNote').css('height', roundNote_height + 'px');
                    $('#id_divRoundNote').css('top', roundNote_top + 'px');
                    $('#id_divRoundNote').css('right', (roundNote_right + 10) + 'px');
                    $('#id_divRoundNote').css('width', roundNote_width + 'px');
                    $('#id_divRoundNote').css('padding', roundNote_padding + 'px 1px');
                    $('#id_divRoundNote').css('font-size', roundNote_font + 'px');

                    var maxProfit_right = $('#play_button_tab_content').width() / 100 * 85;
                    $('.max-profit').css('right', maxProfit_right + 'px');

                    var recentHistoryPadding = ($('#id_divRecentHistory').find('.scroller').innerWidth() - $('#id_divRecentHistory').find('.scroller').width()) / 2;
                    $('#id_divRecentHistory').find('.scroller').css('padding-left', recentHistoryPadding + 'px');

                    $('#id_imgFireworks').css('top', '100px');
                    $('#id_imgFireworks').css('right', width / 2 - 50 + 'px');

                    $(document).on('click', '.custom-tab-menu', function () {
                        if ($(this).hasClass('custom-tab-menu-custom')) {
                            setTextareaHeight();
                            function setTextareaHeight () {
                                if ($('#id_textareaCustomScript').css('height') == undefined) { setTimeout(setTextareaHeight, 100); } else {
                                    $('#id_textareaCustomScript').css('height', 'auto');
                                    $('.custom-customscript-button').css('margin-top', ($('#id_textareaCustomScript').height() - 60) + 'px', '!important');
                                }
                            }
                        }
                    });
                }
            }
        }
    }
});
