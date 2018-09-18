var lib = require('./lib');
var user = require('./user');

function staticPageLogged (page, loggedGoTo) {
    return function (req, res) {
        var user = req.user;
        if (!user) {
            if (page === 'register') {
                // console.log('= Register With REF_ID : url - ' + req.url);
                var ref_id;
                ref_id = req.params.ref_id;
                req.i18n_lang = 'zh';
                if (ref_id) {
                    ref_id = lib.decIntroUrl(ref_id);
                    console.log('= Register With REF_ID : decode - ' + ref_id);
                    console.log('= Register With REF_ID : render - register with ref_id = ' + ref_id);
                    return res.render('register', {
                        ref_id: ref_id
                    });
                }
                // console.log('= Register With REF_ID : render - register without ref_id');
                return res.render('register');
            }

            return res.render(page);
        }

        if (loggedGoTo) return res.redirect(loggedGoTo);

        return res.render(page, { user: user });
    };
};

function restrict (req, res, next) {
    if (!req.user) {
        res.status(401);
        if (req.header('Accept') === 'text/plain') { res.send('Not authorized'); } else { res.render('401'); }
    } else { next(); }
};

module.exports = function (app) {
    app.get('/', user.index);
    app.post('/prepare', user.prepare);
    app.post('/getBaseInfo', user.getBaseInfo);
    app.post('/trade', user.trade);
    app.post('/checkStatus', user.checkStatus);
    app.get('/bookmark/:orderId', user.bookmark);
    app.post('/getPriceInfo', user.getPriceInfo);

    app.get('/register', staticPageLogged('register', '/play'));
    app.get('/register/:ref_id', staticPageLogged('register', '/play'));
    app.get('/login', staticPageLogged('login', '/play'));
    app.get('/faq_en', staticPageLogged('faq_en'));
    app.get('/faq_zh', staticPageLogged('faq_zh'));

    app.get('/no_user', staticPageLogged('profile_no_user'));
    app.get('/no_user_msg', staticPageLogged('profile_no_user_msg'));

    app.get('/error', function (req, res, next) { // Sometimes we redirect people to /error
        return res.render('error');
    });

    app.post('/login', user.login);
    app.post('/register', user.register);
    app.post('/register-verify', user.registerVerify);
    app.post('/resendRegisterVerifyCode', user.resendRegisterVerifyCode);

    app.get('*', function (req, res) {
        res.status(404);
        res.render('404');
    });

    app.post('/setLanguage', function (req, res, next) {
        var current_url = req.body.current_url;
        var language_code = req.body.language_code;

        if (current_url.includes('faq')) {
            current_url = current_url.replace(/en/g, language_code);
            current_url = current_url.replace(/zh/g, language_code);
        } else {
            if (current_url.includes('clang')) {
                current_url = current_url.replace('clang=en', 'clang=' + language_code);
                current_url = current_url.replace('clang=zh', 'clang=' + language_code);
            } else if (current_url.includes('?')) {
                current_url = current_url + '&clang=' + language_code;
            } else {
                current_url = current_url + '?clang=' + language_code;
            }
        }
        res.redirect(current_url);
    });
    app.post('/getCoinsInfo', user.getCoinsInfo);
};
