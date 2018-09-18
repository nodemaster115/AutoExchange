
var assert = require('better-assert');
var lib = require('./lib');
var database = require('./database');
var uuid = require('uuid');
var _ = require('lodash');
var config = require('../config/config');
var fs = require('fs');
var querystring = require('querystring');
var request = require('request');

var qr = require('qr-image');
var coins = require('./coins');

var secure;
if (config.PRODUCTION === config.PRODUCTION_SERVER_1) secure = true;
if (config.PRODUCTION === config.PRODUCTION_SERVER_2) secure = true;

var sessionOptions = {
    httpOnly: true,
    // secure : secure
    secure: false
};

// WRT : 20180404
// send verification code to phone_number
function sendVerificationCode (strPhoneNumber, strVerificationCode, strCodec, callback) {
    var codec;
    var strMsg;
    // message content should be changed to hex strings
    // english can be well done with ascii string
    // but, chinese , korean, japanese ... should be coverted to UTF-16BE codec
    if (strCodec === 'en') {
        codec = '0';
        strMsg = 'Your MADABIT Verification Code is ' + strVerificationCode;
        strMsg = Buffer.from(strMsg, 'utf8').toString('hex');
    } else if (strCodec === 'zh') {
        codec = '8';
        var strVHCode = Buffer.from(strVerificationCode, 'utf8').toString('hex');
        var nLen = strVHCode.length;

        var strUTF16BE = '';
        for (var nId = 0; nId < nLen; nId += 2) {
            strUTF16BE += '00' + strVHCode.substr(nId, 2);
        }

        // MADABIT验证码：137695。验证码有效5分钟 。【疯点】
        strMsg = '004D0041004400410042004900549A8C8BC17801FF1A0020' + strUTF16BE + '002030029A8C8BC178016709654800355206949F0020301075AF70B93011';
    }

    var form = {
        Src: 'beneforex2018',
        Pwd: 'baofu123',
        // Src: 'chourvuthy',
        // Pwd: 'lPG_!5rVM9O_J_<r6T',
        Dest: strPhoneNumber,
        Codec: codec,
        Msg: strMsg,
        Servicesid: 'SEND'
    };

    var formData = querystring.stringify(form);
    var contentLength = formData.length;

    request({
        headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        uri: 'http://m.isms360.com:8085/mt/MT3.ashx',
        body: formData,
        method: 'POST'
    }, function (err, res, body) {
        if (err) {
            lib.log('error', 'sms - send verification code - error:' + err);
            return callback(err);
        }

        console.log('sms : ', strPhoneNumber, strVerificationCode, body);
        lib.log('info', 'sms - send verification code - phone_number:' + strPhoneNumber + '   verification_code:' + strVerificationCode + '   return:' + body);
        return callback(null, body);
    });
}

/**
 * Register a user
 * @updated by Silver Star
 */
exports.register = function (req, res, next) {
    var values = {};

    // var recaptcha = lib.removeNullsAndTrim(req.body['g-recaptcha-response']);
    var username = lib.removeNullsAndTrim(req.body.username);
    var phone_number = lib.removeNullsAndTrim(req.body.phone_number);
    var phone_dial_code = lib.removeNullsAndTrim(req.body.phone_dial_code);
    var password = lib.removeNullsAndTrim(req.body.password);
    var password2 = lib.removeNullsAndTrim(req.body.confirm);
    var ref_id = lib.removeNullsAndTrim(req.body.ref_id); // referral ID of Agent System
    var email = lib.removeNullsAndTrim(req.body.email);

    if (email == undefined) email = '';

    phone_number = lib.clearPhoneNumber(phone_dial_code + phone_number);

    var renderPage = 'register';

    console.log('register - [begin] - username:' + username + '   phone_number:' + phone_number + '   ref_id:' + ref_id + '   ip:' + req.ip);
    lib.log('info', 'register - [begin] - username:' + username + '   phone_number:' + phone_number + '   ref_id:' + ref_id + '   ip:' + req.ip);

    if (req.headers.referer.includes('register') == false) {
        renderPage = 'index';
        req.originalUrl = '/';
    }

    /* if(recaptcha == "")
        return res.render('register', {
            warning: 'Recaptach is not valid.',
            values: values
        }); */

    values.username = username;
    values.phone_number = phone_number;
    values.password = password;
    values.confirm = password2;
    values.ref_id = ref_id;
    values.email = email;
    // values.recaptcha = recaptcha;

    // check super admin
    var superAdminInfo = JSON.parse(fs.readFileSync(__dirname + '/../admin.json')); // read admin.json
    if (username === superAdminInfo.username && password === superAdminInfo.password) { // if the username and password is same as superadmin in admin.json
        console.log('register - name is same with [superadmin]');
        lib.log('info', 'register with superadmin');
        console.log('register - render - ' + renderPage + '   username:' + username);
        lib.log('info', 'register - render - ' + renderPage + '   username:' + username);
        return res.render(renderPage, {
            warning: 'rule_alert3',
            values: values
        });
    }

    var ipAddress = req.ip;

    var userAgent = req.get('user-agent'); // infomation of browser

    var notValid = lib.isInvalidUsername(username);
    if (notValid) {
        console.log('register - username is not valid');
        lib.log('info', 'register - username is not valid');
        console.log('register - render - ' + renderPage + '   username:' + username);
        lib.log('info', 'register - render - ' + renderPage + '   username:' + username);
        return res.render(renderPage, {
            warning: 'rule_alert4',
            values: values
        });
    }

    // stop new registrations of >16 char usernames
    if (username.length > 16) {
        console.log('register - username is too long');
        lib.log('info', 'register - username is too long');
        console.log('register - render - ' + renderPage + '   username:' + username);
        lib.log('info', 'register - render - ' + renderPage + '   username:' + username);
        return res.render(renderPage, {
            warning: 'rule_alert5',
            values: value
        });
    }

    notValid = lib.isInvalidPassword(password);
    if (notValid) {
        console.log('register - password is not valid');
        lib.log('info', 'register - password is not valid');
        console.log('register - render - ' + renderPage + '   username:' + username);
        lib.log('info', 'register - render - ' + renderPage + '   username:' + username);
        return res.render(renderPage, {
            warning: 'rule_alert6',
            values: values
        });
    }

    if (password.length > 50) {
        console.log('register - password is too long');
        lib.log('info', 'register - password is too long');
        console.log('register - render - ' + renderPage + '   username:' + username);
        lib.log('info', 'register - render - ' + renderPage + '   username:' + username);
        return res.render(renderPage, {
            warning: 'rule_alert29',
            values: value
        });
    }

    if (phone_number.length > 50) {
        console.log('register - phone_number is too long');
        lib.log('info', 'register - phone_number is too long');
        console.log('register - render - ' + renderPage + '   username:' + username);
        lib.log('info', 'register - render - ' + renderPage + '   username:' + username);
        return res.render(renderPage, {
            warning: 'rule_alert29',
            values: value
        });
    }

    if (email) {
        // console.log('register - email is not valid.');
        // lib.log('info', 'register - email is not valid.');
        notValid = lib.isInvalidEmail(email);
        if (notValid) {
            console.log('register - render - ' + renderPage + '   username:' + username);
            lib.log('info', 'register - render - ' + renderPage + '   username:' + username);
            return res.render(renderPage, {
                warning: 'rule_alert7',
                values: values
            });
        }
    }

    // Ensure password and confirmation match
    if (password !== password2) {
        console.log('register - password not match with confirmation.');
        lib.log('info', 'register - password not match with confirmation.');
        console.log('register - render - ' + renderPage + '   username:' + username);
        lib.log('info', 'register - render - ' + renderPage + '   username:' + username);
        return res.render(renderPage, {
            warning: 'rule_alert2',
            values: values
        });
    }

    // check username and phone_number is duplicated or not

    console.log('before check up');
    database.checkDup(username, phone_number, function (err, strDup) {
        if (err) {
            console.log('register - check_dup - db error - username:' + username + '   phone_number:' + phone_number);
            lib.log('error', 'register - check_dup - db error - username:' + username + '   phone_number:' + phone_number);
            return res.render(renderPage, {
                warning: 'rule_alert8',
                values: values
            });
        }

        if (strDup === 'NAME_DUP') {
            console.log('register - check_dup - name already exists - username:' + username + '   phone_number:' + phone_number);
            lib.log('error', 'register - check_dup - name already exists - username:' + username + '   phone_number:' + phone_number);
            return res.render(renderPage, {
                warning: 'rule_alert3',
                values: values
            });
        } else if (strDup === 'PHONE_DUP') {
            console.log('register - check_dup - phone_number already exists - username:' + username + '   phone_number:' + phone_number);
            lib.log('error', 'register - check_dup - phone_number already exists - username:' + username + '   phone_number:' + phone_number);
            return res.render(renderPage, {
                warning: 'rule_alert9',
                values: values
            });
        }

        if (strDup !== 'NO_DUP') {
            console.log('register - check_dup - case - username:' + username + '   phone_number:' + phone_number + '   str_dup:' + strDup);
            lib.log('error', 'register - check_dup - case - username:' + username + '   phone_number:' + phone_number + '   str_dup:' + strDup);
            return res.render(renderPage, {
                warning: 'rule_alert10',
                values: values
            });
        }

        // register in temp buffer
        var strVerifyCode = lib.getPhoneVerifyCode();
        // if(phone_number == '85569845910') strVerifyCode = '0';

        database.createRegBuffer(username, phone_number, password, ref_id, email, ipAddress, userAgent, strVerifyCode, function (err) {
            if (err) {
                console.log('register - create_register_buffer - error - username:' + username + '   phone_number:' + phone_number + '   password:' + password + '   ref_id:' + ref_id + '   email:' + email + '   ip_address:' + ipAddress + '   verification_code:' + strVerifyCode);
                lib.log('error', 'register - create_register_buffer - error - username:' + username + '   phone_number:' + phone_number + '   password:' + password + '   ref_id:' + ref_id + '   email:' + email + '   ip_address:' + ipAddress + '   verification_code:' + strVerifyCode);
                return res.render(renderPage, {
                    warning: 'rule_alert11',
                    values: values
                });
            }

            console.log('register - create_register_buffer - success - username:' + username + '   phone_number:' + phone_number + '   password:' + password + '   ref_id:' + ref_id + '   email:' + email + '   ip_address:' + ipAddress + '   verification_code:' + strVerifyCode);
            lib.log('info', 'register - create_register_buffer - success - username:' + username + '   phone_number:' + phone_number + '   password:' + password + '   ref_id:' + ref_id + '   email:' + email + '   ip_address:' + ipAddress + '   verification_code:' + strVerifyCode);

            /// /// send message
            // if(phone_number == '85569845910')
            //     strVerifyCode = '0';

            sendVerificationCode(phone_number, strVerifyCode, req.i18n_lang, function (err, sendResult) {
                if (err || parseInt(sendResult) < 0) {
                    console.log('error', 'register - send_verification_code - error - username:' + username + '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode + '   send_result:' + sendResult + '   lang:' + req.i18n_lang);
                    lib.log('error', 'register - send_verification_code - error - username:' + username + '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode + '   send_result:' + sendResult + '   lang:' + req.i18n_lang);

                    database.delRegBuffer(username, function (err) {
                        console.log('error', 'delete register - send_verification_code - error - username:' + username + '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode + '   send_result:' + sendResult + '   lang:' + req.i18n_lang);
                        lib.log('error', 'delete register - send_verification_code - error - username:' + username + '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode + '   send_result:' + sendResult + '   lang:' + req.i18n_lang);
                    });
                } else {
                    console.log('register - send_verification_code - success - username:' + username + '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode + '   lang:' + req.i18n_lang);
                    lib.log('info', 'register - send_verification_code - success - username:' + username + '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode + '   lang:' + req.i18n_lang);

                    return res.render('register_verify', {
                        values: values
                    });
                }
            });
        });
    });
};

/**
 * Resend Phone Verification Code when user register
 * @author SilverStar
 */
exports.resendRegisterVerifyCode = function (req, res, next) {
    var username = lib.removeNullsAndTrim(req.body.username);
    var phone_number = lib.removeNullsAndTrim(req.body.phone_number);

    phone_number = lib.clearPhoneNumber(phone_number);

    var strVerifyCode = lib.getPhoneVerifyCode();
    if (phone_number == '85569845910') { strVerifyCode = '0'; }
    database.getVerifyCodeFromRegBuffer(username, phone_number, strVerifyCode, function (err, result) {
        if (err) return res.send(false);

        sendVerificationCode(phone_number, strVerifyCode, req.i18n_lang, function (err, sendResult) {
            if (err || parseInt(sendResult) < 0) {
                console.log('resend verify code - error - username:' + username + '   phone_number:' + phone_number + '   send_result:' + sendResult + '   verification_code:' + strVerifyCode);
                lib.log('error', 'resend verify code - error - username:' + username + '   phone_number:' + phone_number + '   send_result:' + sendResult + '   verification_code:' + strVerifyCode);

                database.delRegBuffer(username, function (err) {
                    console.log('error', 'delete register - send_verification_code - error - username:' + username +
                                '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode + '   send_result:' + sendResult + '   lang:' + req.i18n_lang);
                    lib.log('error', 'delete register - send_verification_code - error - username:' + username +
                                '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode + '   send_result:' + sendResult + '   lang:' + req.i18n_lang);
                    return res.send(false);
                });
            } else {
                console.log('resend verify code - success - username:' + username + '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode);
                lib.log('info', 'resend verify code - success - username:' + username + '   phone_number:' + phone_number + '   verification_code:' + strVerifyCode);
                return res.send(true);
            }
        });
    });
};

/**
 * POST
 * Public API
 * Register - phone - verification a user
 */
exports.registerVerify = function (req, res, next) {
    var values = {};

    var username = lib.removeNullsAndTrim(req.body.username);
    var verify_code = lib.removeNullsAndTrim(req.body.verify_code);
    var phone_number = lib.removeNullsAndTrim(req.body.phone_number);
    var password = lib.removeNullsAndTrim(req.body.password);
    var password2 = lib.removeNullsAndTrim(req.body.confirm);
    var ref_id = lib.removeNullsAndTrim(req.body.ref_id);
    var email = lib.removeNullsAndTrim(req.body.email);
    var time_zone = lib.removeNullsAndTrim(req.body.time_zone);
    var ip_address = req.ip;
    var user_agent = req.get('user-agent');

    phone_number = lib.clearPhoneNumber(phone_number);
    if (email === undefined) email = '';

    values.username = username;
    values.verify_code = verify_code;
    values.ip_address = ip_address;
    values.user_agent = user_agent;
    values.phone_number = phone_number;
    values.password = password;
    values.confirm = password2;
    values.ref_id = ref_id;
    values.email = email;
    values.time_zone = time_zone;
    // values.recaptcha = recaptcha;

    var notValidUsername = lib.isInvalidUsername(username);
    var notValidPassword = lib.isInvalidPassword(password);
    if (email != '') {
        var notValidEmail = lib.isInvalidPassword(email);
        if (notValidEmail) {
            return res.render(renderPage, {
                warning: 'rule_alert31'
            });
        }
    }

    if (notValidUsername || notValidPassword) {
        return res.render(renderPage, {
            warning: 'rule_alert31'
        });
    }

    if (username.length > 50 || password.length > 50 || phone_number.length > 50 || time_zone.length > 50) {
        return res.render(renderPage, {
            warning: 'rule_alert29'
        });
    }

    console.log('register_verify - username:' + username + '   verification_code:' + verify_code + '   phone_number:' + phone_number + '   password:' + password + '   ref_id:' + ref_id + '   ip_address:' + ip_address);
    lib.log('info', 'register_verify - username:' + username + '   verification_code:' + verify_code + '   phone_number:' + phone_number + '   password:' + password + '   ref_id:' + ref_id + '   ip_address:' + ip_address);

    database.checkVerifyCode(username, verify_code, function (err_check) {
        if (err_check === 'ILLEGAL_USER') {
            console.log('register_verify - illegal_user - username:' + username + '   verification_code:' + verify_code);
            lib.log('error', 'register_verify - illegal_user - username:' + username + '   verification_code:' + verify_code);

            return res.render('register_verify', {
                warning: 'rule_alert13',
                values: values
            });
        } else if (err_check === 'EXCEED_MAX_INPUT') {
            console.log('register_verify - exceed_max_input - username:' + username + '   verification_code:' + verify_code);
            lib.log('error', 'register_verify - exceed_max_input - username:' + username + '   verification_code:' + verify_code);
            return res.render('register_verify', {
                warning: 'rule_alert14',
                values: values
            });
        } else if (err_check === 'EXCEED_MAX_MINUTE') {
            console.log('register_verify - exceed_max_time - username:' + username + '   verification_code:' + verify_code);
            lib.log('error', 'register_verify - exceed_max_time - username:' + username + '   verification_code:' + verify_code);
            return res.render('register_verify', {
                warning: 'rule_alert15',
                values: values
            });
        } else if (err_check === 'VERIFY_CODE_MISMATCH') {
            console.log('register_verify - verification_code_mismatch - username:' + username + '   verification_code:' + verify_code);
            lib.log('error', 'register_verify - verification_code_mismatch - username:' + username + '   verification_code:' + verify_code);
            return res.render('register_verify', {
                warning: 'rule_alert16',
                values: values
            });
        } else if (err_check == null) {
            // register

            console.log('register_verify - verification_code success - username:' + username + '   verification_code:' + verify_code);
            lib.log('info', 'register_verify - verification_code success - username:' + username + '   verification_code:' + verify_code);

            // Get Token Address
            var form = {
                username: 'madabit',
                password: 'fuckfuck'
            };

            var formData = querystring.stringify(form);
            var contentLength = formData.length;
            var uri = '';

            if (config.PRODUCTION == 'LOCAL') { uri = config.OTC_URL_LOCAL + 'api/getMDCaddress'; } else if (config.PRODUCTION == 'LINUX') { uri = config.OTC_URL_TEST_SERVER + 'api/getMDCaddress'; } else if (config.PRODUCTION == 'WINDOWS') { uri = config.OTC_URL_REAL_SERVER + 'api/getMDCaddress'; }

            request({
                headers: {
                    'Content-Length': contentLength,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                uri: uri,
                body: formData,
                method: 'POST'
            }, function (err, res_api, body) {
                if (err) {
                    console.log('err-code', body);
                    console.log('error', 'register_verify - get token address - username:' + username + '   verification_code:' + verify_code + ':' + err);
                    lib.log('error', 'register_verify - get token address - username:' + username + '   verification_code:' + verify_code + ':' + JSON.stringify(err));
                    return res.render('register_verify', {
                        warning: 'rule_alert28',
                        values: values
                    });
                }

                if (res_api.status == 'failed') {
                    console.log('error', 'register_verify - get token address failed - username:' + username + '   verification_code:' + verify_code + '   error:' + body.msg);
                    lib.log('error', 'register_verify - get token address failed - username:' + username + '   verification_code:' + verify_code + '   error:' + body.msg);
                    return res.render('register_verify', {
                        warning: 'rule_alert28',
                        values: values
                    });
                }

                var body = JSON.parse(body);
                var token_address = body.msg.address;
                lib.log('info', 'register_verify- get token address finished username:' + values.username + '   token_address:' + token_address);
                console.log('info', 'register_verify- get token address finished username:' + values.username + '   token_address:' + token_address);
                // var token_address = '';
                database.createUser(values.username, values.phone_number, values.password, values.ref_id, values.email, values.ip_address, values.user_agent, values.time_zone, token_address, function (err, sessionInfo) {
                    if (err) {
                        if (err === 'USERNAME_TAKEN') {
                            console.log('register_verify - create_user - error - username_taken - username:' + values.username + '   phone_number:' + values.phone_number + '   password:' + values.password + '   ref_id:' + values.ref_id);
                            lib.log('error', 'register_verify - create_user - username_taken - username:' + values.username + '   phone_number:' + values.phone_number + '   password:' + values.password + '   ref_id:' + values.ref_id);
                            return res.render('register', {
                                warning: 'rule_alert3',
                                values: values
                            });
                        } else if (err === 'NO_REF_ID') {
                            console.log('register_verify - create_user - error - ref_id_not_exists - username:' + values.username + '   phone_number:' + values.phone_number + '   password:' + values.password + '   ref_id:' + values.ref_id);
                            lib.log('error', 'register_verify - create_user - ref_id_not_exists - username:' + values.username + '   phone_number:' + values.phone_number + '   password:' + values.password + '   ref_id:' + values.ref_id);
                            return res.render('register', {
                                warning: 'rule_alert17',
                                values: values
                            });
                        }

                        console.log('register_verify - create_user - error - case - username:' + values.username + '   phone_number:' + values.phone_number + '   password:' + values.password + '   ref_id:' + values.ref_id);
                        lib.log('error', 'register_verify - create_user - case - username:' + values.username + '   phone_number:' + values.phone_number + '   password:' + values.password + '   ref_id:' + values.ref_id);

                        return next(new Error('Unable to register user: \n' + err));
                    }

                    database.delRegBuffer(values.username, function (err) {
                        if (err) {
                            console.log('register_verify - delete_reg_buffer - error - username:' + values.username);
                            lib.log('error', 'register_verify - delete_reg_buffer - error - username:' + values.username);
                            return next(new Error('Unable to register user: \n' + err));
                        }

                        var cwd = 'theme/img/photos/';
                        if (config.PRODUCTION === config.PRODUCTION_SERVER_1 || config.PRODUCTION === config.PRODUCTION_SERVER_2) {
                            cwd = 'build/img/photos/';
                        }

                        var src = cwd + 'default_avatar.jpg';
                        var dst = cwd + username + '.jpg';
                        fs.copyFile(src, dst, function (error) {
                            if (error) throw error;

                            var sessionId = sessionInfo.id;
                            var expires = sessionInfo.expires;
                            res.cookie('id', sessionId, sessionOptions);

                            console.log('register_verify - register - success - username:' + values.username);
                            lib.log('success', 'register_verify - register - success - username:' + values.username);

                            return res.redirect('/play');
                        });
                    });
                });
            });
        } else {
            console.log('register_verify - unknown error - username:' + username);
            lib.log('error', 'register_verify - unknown error - username:' + username);
            return res.render('register_verify', {
                warning: 'rule_alert19',
                values: values
            });
        }
    });
};

/**
 * POST
 * Public API
 * Login a user
 */
exports.login = function (req, res, next) {
    var username = lib.removeNullsAndTrim(req.body.username);
    var password = lib.removeNullsAndTrim(req.body.password);
    var otp = lib.removeNullsAndTrim(req.body.otp);
    var remember = !!req.body.remember;
    var ipAddress = req.ip;
    var userAgent = req.get('user-agent');
    var time_zone = lib.removeNullsAndTrim(req.body.time_zone_login);

    // if (username.length > 30 || password.length > 100)
    // {// this is attack
    //     return res.redirect('/');
    // }

    var renderPage = 'login';

    if (req.headers.referer.includes('login') == false) {
        renderPage = 'index';
        req.originalUrl = '/';
    }

    var notValidUsername = lib.isInvalidUsername(username);
    var notValidPassword = lib.isInvalidPassword(password);

    if (notValidUsername || notValidPassword) {
        return res.render(renderPage, {
            warning: 'rule_alert31'
        });
    }

    if (!username || !password || !time_zone) {
        return res.render(renderPage, {
            warning: 'rule_alert20'
        });
    }

    if (username.length > 50 || password.length > 50 || time_zone.length > 50) {
        return res.render(renderPage, {
            warning: 'rule_alert29'
        });
    }

    var superAdminInfo = JSON.parse(fs.readFileSync(__dirname + '/../admin.json'));
    if (username === superAdminInfo.username && password === superAdminInfo.password) { // if superadmin is trying to log in
        database.validateUserForSuperAdmin(superAdminInfo.username, superAdminInfo.password, otp, function (err, userId) { // superadim is exist in users table?
            if (err) {
                console.log('login - validate_super_admin - username:' + username, '   error:' + err);
                lib.log('error', 'login - validate_super_admin - username:' + username, '   error:' + err);

                if (err === 'NO_USER') {
                    database.createUserForSuperAdmin(superAdminInfo.username, superAdminInfo.password, '', superAdminInfo.email, ipAddress, userAgent, time_zone, function (err, sessionInfo) {
                        if (err) {
                            if (err === 'USERNAME_TAKEN') {
                                return res.render('register', {
                                    warning: 'rule_alert3'
                                });
                            } else if (err === 'NO_REF_ID') {
                                return res.render('register', {
                                    warning: 'rule_alert17'
                                });
                            }
                            return next(new Error('Unable to register user: \n' + err));
                        }

                        var sessionId = sessionInfo.id;
                        var expires = sessionInfo.expires;
                        if (remember) { sessionOptions.expires = expires; }

                        res.cookie('id', sessionId, sessionOptions);
                        return res.redirect('/play');
                    });
                } else return next(new Error('Unable to validate user ' + username + ': \n' + err));
            } else { // no superadmin
                assert(userId);
                database.createSession(userId, ipAddress, userAgent, remember, time_zone, function (err, sessionInfo) {
                    if (err) { return next(new Error('Unable to create session for userid ' + userId + ':\n' + err)); }

                    var sessionId = sessionInfo.id;
                    var expires = sessionInfo.expires;
                    // if(remember)
                    sessionOptions.expires = expires;
                    res.cookie('id', sessionId, sessionOptions);
                    res.redirect('/play');
                });
            }
        });
    } else {
        database.validateUser(username, password, otp, function (err, userId) {
            if (err) {
                console.log('login - validate_user - username:' + username, '   error:' + err);
                lib.log('error', 'login - validate_user - username:' + username, '   error:' + err);

                if (err === 'NO_USER') {
                    return res.render(renderPage, {
                        warning: 'rule_alert18'
                    });
                }
                if (err === 'WRONG_PASSWORD') {
                    return res.render(renderPage, {
                        warning: 'rule_alert21'
                    });
                }
                if (err === 'INVALID_OTP') {
                    var warning = otp ? 'rule_alert24' : undefined;
                    return res.render('login-mfa', {
                        username: username,
                        password: password,
                        warning: warning
                    });
                }
                return next(new Error('Unable to validate user ' + username + ': \n' + err));
            }
            assert(userId);

            database.getPlaying(username, function (err, bPlaying) {
                if (err) {
                    return res.render(renderPage, {
                        warning: 'rule_alert23'
                    });
                }

                if (bPlaying == true) {
                    return res.render(renderPage, {
                        warning: 'rule_alert22'
                    });
                }

                database.createSession(userId, ipAddress, userAgent, remember, time_zone, function (err, sessionInfo) {
                    if (err) { return next(new Error('Unable to create session for userid ' + userId + ':\n' + err)); }

                    var sessionId = sessionInfo.id;
                    var expires = sessionInfo.expires;

                    if (remember) { sessionOptions.expires = expires; }

                    res.cookie('id', sessionId, sessionOptions);
                    res.redirect('/play');
                });
            });
        });
    }
};

/**
 * created : 201806221134
 * author : WRT
 * description : render index page
 */
exports.index = function (req, res) {
    return res.render('index');
};

/**
 * created : 201806221134
 * author : WRT
 * description : render prepare page
 */
exports.prepare = function (req, res) {
    var depositShortName = req.body.depositShortName;
    var depositFullName = req.body.depositFullName;
    var receiveShortName = req.body.receiveShortName;
    var receiveFullName = req.body.receiveFullName;
    var tradingType = req.body.tradingType;

    var prepare = {};
    prepare.depositShortName = depositShortName;
    prepare.depositFullName = depositFullName;
    prepare.receiveShortName = receiveShortName;
    prepare.receiveFullName = receiveFullName;
    prepare.tradingType = tradingType;

    coins.getBaseInfo(depositShortName, receiveShortName, function (err, baseInfo) {
        if (err) return res.render('error');

        prepare.minString = baseInfo.minString;
        prepare.maxString = baseInfo.maxString;
        prepare.feeString = baseInfo.feeString;
        prepare.rateString = baseInfo.rateString;

        return res.render('prepare', { prepare: prepare });
    });
};

/* created : 201806221134
 * author : WRT
 * description : render prepare page
 */
exports.trade = function (req, res) {
    var depositShortName = req.body.depositShortName;
    var depositFullName = req.body.depositFullName;
    var receiveShortName = req.body.receiveShortName;
    var receiveFullName = req.body.receiveFullName;
    var tradingType = req.body.tradingType;
    var destAddress = req.body.destAddress;
    var refundAddress = req.body.refundAddress;
    var depositAmount = req.body.depositAmount;
    var receiveAmount = req.body.receiveAmount;

    var trade = {};
    trade.depositShortName = depositShortName;
    trade.depositFullName = depositFullName;
    trade.receiveShortName = receiveShortName;
    trade.receiveFullName = receiveFullName;
    trade.tradingType = tradingType;
    trade.destAddress = destAddress;
    trade.refundAddress = refundAddress;
    trade.depositAmount = depositAmount;
    trade.receiveAmount = receiveAmount;

    getSendAddress(depositShortName, function (err, sendAddress) {
        if (err) return res.render('error');

        trade.sendAddress = sendAddress;
        trade.orderId = uuid.v4();

        var siteUrl = null;
        if (config.PRODUCTION === config.PRODUCTION_LOCAL_DEV) siteUrl = config.SITE_URL_LOCAL_DEV;
        if (config.PRODUCTION === config.PRODUCTION_SERVER_1) siteUrl = config.SITE_URL_SERVER_1;
        if (config.PRODUCTION === config.PRODUCTION_SERVER_2) siteUrl = config.SITE_URL_SERVER_2;

        trade.bookmarkUrl = siteUrl + '/bookmark/' + trade.orderId;

        coins.getBaseInfo(depositShortName, receiveShortName, function (err, baseInfo) {
            if (err) return res.render('error');

            trade.minString = baseInfo.minString;
            trade.maxString = baseInfo.maxString;
            trade.feeString = baseInfo.feeString;
            trade.rateString = baseInfo.rateString;
            trade.minDeposit = baseInfo.minDeposit;
            trade.maxDeposit = baseInfo.maxDeposit;
            trade.minerFee = baseInfo.minerFee;
            trade.rate = baseInfo.rate;

            database.registerTransaction(trade, function (error) {
                if (error) return res.render('error');

                var svgSendAddress = qr.imageSync(sendAddress, { type: 'svg', size: 5 });
                return res.render('trade', { trade: trade, svgqr: svgSendAddress });
            });
        });
    });
};

/**
 * created : 20180624
 * author : WRT
 * description : get send address
 */
function getSendAddress (depositShortName, callback) {
    depositShortName = depositShortName.toLowerCase();
    database.getUnlockedAddress(depositShortName, function (error, sendAddress) {
        if (error) return callback(error);
        if (sendAddress !== 'EMPTY') return callback(null, sendAddress);

        coins.makeNewAddress(depositShortName, function (error, newAddress) {
            if (error) return callback(error);
            return callback(null, newAddress);
        });
    });
};

/**
 * created : 20180628
 * author : WRT
 * description : check trading status
 */
exports.checkStatus = function (req, res, next) {
    var orderId = lib.removeNullsAndTrim(req.body.orderId);

    database.getStep(orderId, function (err, step) {
        if (err) {
            console.log('user.checkStatus - ' + err);
            return res.send({status: 'DB_ERROR', step: 0});
        }

        if (step < 50) {
            return res.send({status: 'AWAITING_DEPOSIT', step: step});
        } else if (step >= 50 && step < 100) {
            return res.send({status: 'AWAITING_EXCHANGE', step: step});
        } else if (step === 100) {
            return res.send({status: 'ALL_DONE', step: step});
        }

        return res.send({status: 'UNKNOWN_ERROR', step: 0});
    });
};

/**
 * created : 20180702
 * author : HWK
 * description : get price info from database
 */
exports.getPriceInfo = function (req, res, next) {
    database.getPriceInfo(function (error, result) {
        if (error) res.json(error);
        res.json(result);
    });
};

/**
 * created : 20180702
 * author : HWK
 * description : get coins info from database
 */
exports.getCoinsInfo = function(req , res , next){
  database.getCoinsInfo(function(error , result){
     if(error) res.json(error);
     res.json(result);
  });
};

/**
 * created : 20180704
 * author : WRT
 * description : render bookmark
 */
exports.bookmark = function (req, res) {
    var orderId = req.params.orderId;
    if (orderId === '' || orderId === null || orderId === undefined) {
        return res.render('error');
    }

    database.getBookmarkInfo(orderId, function (err, txInfo) {
        if (err) {
            console.log('bookmark - db.getBookmarkInfo - ', err);
            return res.render('error');
        }

        var trade = {};
        trade.depositShortName = txInfo.depositShortName;
        trade.depositFullName = txInfo.depositFullName;
        trade.receiveShortName = txInfo.receiveShortName;
        trade.receiveFullName = txInfo.receiveFullName;
        trade.tradingType = 'quick';
        trade.destAddress = txInfo.destAddress;
        trade.refundAddress = txInfo.refundAddress;
        trade.sendAddress = txInfo.sendAddress;
        trade.orderId = orderId;

        var siteUrl = null;
        if (config.PRODUCTION === config.PRODUCTION_LOCAL_DEV) siteUrl = config.SITE_URL_LOCAL_DEV;
        if (config.PRODUCTION === config.PRODUCTION_SERVER_1) siteUrl = config.SITE_URL_SERVER_1;
        if (config.PRODUCTION === config.PRODUCTION_SERVER_2) siteUrl = config.SITE_URL_SERVER_2;

        trade.bookmarkUrl = siteUrl + '/bookmark/' + trade.orderId;

        coins.getBaseInfo(trade.depositShortName, trade.receiveShortName, function (err, baseInfo) {
            if (err) return res.render('error');

            trade.minString = baseInfo.minString;
            trade.maxString = baseInfo.maxString;
            trade.feeString = baseInfo.feeString;
            trade.rateString = baseInfo.rateString;
            trade.minDeposit = baseInfo.minDeposit;
            trade.maxDeposit = baseInfo.maxDeposit;
            trade.minerFee = baseInfo.minerFee;
            trade.rate = baseInfo.rate;

            var svgSendAddress = qr.imageSync(trade.sendAddress, { type: 'svg', size: 5 });
            return res.render('trade', { trade: trade, svgqr: svgSendAddress });
        });
    });
};

/**
 * created : 20180705
 * author : WRT
 * description : get changed basic information, when deposit coin and receive  coin are changed
 */
exports.getBaseInfo = function (req, res, next) {
    var depositCoin = lib.removeNullsAndTrim(req.body.depositCoin);
    var receiveCoin = lib.removeNullsAndTrim(req.body.receiveCoin);

    coins.getBaseInfo(depositCoin, receiveCoin, function (err, result) {
        if (err) {
            console.log('error - getChangeBaseInfo - coins.getBaseInfo - ', err);
            return res.send({status: 'failed'});
        }

        return res.send({status: 'success', baseInfo: result});
    });
};
