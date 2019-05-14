const express = require('express');
const app = express();
const db = require('./db');
const nunjucks = require('nunjucks');
var router = express.Router();
const fs = require('fs');
const bodyParser = require("body-parser");
const formidable = require('formidable');
const busboy = require('connect-busboy');
const auth = require('./authentication.js');
const cookieParser = require('cookie-parser');
//...
app.use(cookieParser())

app.use(busboy());
const fileupload = require("express-fileupload")
// const cookieParser = require("cookie-parser");
// Creating the parser for data application/x-www-form-urlencoded
app.use(bodyParser.json());
const urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);
//app.use(express.static(__dirname + 'auth'));


//var user = NULL;
const setAppCookie = () => firebase.auth().currentUser &&
    firebase.auth().currentUser.getToken().then(token => {
        Cookies.set('token', token, {
            domain: window.location.hostname,
            expire: 1 / 24, // One hour
            path: '/',
            secure: false // If served over HTTPS
        });
    });

nunjucks.configure('views', {
    autoescape: true,
    express: app
}); ``

app.get('/auth', (req, res) => {
    //res.render('auth.html'); 
    res.status(200).render('auth.html')


});

app.get('/', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {

            db.query('SELECT b.idBody, b.model, c.name FROM bodies b INNER JOIN companies c ON b.idCompany = c.idCompany ' +
                'WHERE b.idBody IN (SELECT u.idBody FROM users_bodies u WHERE u.idUser = ?);' +
                'SELECT l.idLens, l.model, c.name FROM lenses l INNER JOIN companies c ON l.idCompany = c.idCompany ' +
                'WHERE l.idLens IN (SELECT u.idLens FROM users_lenses u WHERE u.idUser = ?);' +
                'SELECT la.idLAdapter, la.model, c.name FROM l_adapters la INNER JOIN companies c ON la.idCompany = c.idCompany ' +
                'WHERE la.idLAdapter IN (SELECT u.idLAdapter FROM users_l_adapters u WHERE u.idUser = ?); ' +
                'SELECT t.idTripod, t.model, c.name FROM tripods t INNER JOIN companies c ON t.idCompany = c.idCompany ' +
                'WHERE t.idTripod IN (SELECT u.idTripod FROM users_tripods u WHERE u.idUser = ?);' +
                'SELECT ta.idTAdapter, ta.model, c.name FROM t_adapters ta INNER JOIN companies c ON ta.idCompany = c.idCompany ' +
                'WHERE ta.idTAdapter IN (SELECT u.idTAdapter FROM users_t_adapters u WHERE u.idUser = ?);',
                [repairer.idUser, repairer.idUser, repairer.idUser, repairer.idUser, repairer.idUser, repairer.idUser],
                (err, results) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }

                    res.status(200).render('indexBody.html', {
                        results,
                        user: repairer,
                    });
                });
        }
    });
});

app.get('/log_in', (req, res) => {
    res.status(200).render('log_in.html')
});

app.get('/my_equipment', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT b.*, c.name FROM bodies b, companies c " +
                "WHERE b.idBody IN (SELECT ub.idBody FROM users_bodies ub WHERE ub.idUser = ? AND ub.status = 1 ) " +
                "AND  b.idCompany = c.idCompany; " +
                "SELECT l.*, c.name FROM lenses l, companies c " +
                "WHERE l.idLens IN (SELECT ul.idLens FROM users_lenses ul WHERE ul.idUser = ? AND ul.status = 1) " +
                "AND  l.idCompany = c.idCompany; " +
                "SELECT la.*, c.name FROM l_adapters la, companies c " +
                "WHERE la.idLAdapter IN (SELECT ula.idLAdapter FROM users_l_adapters ula WHERE ula.idUser = ? AND ula.status = 1) " +
                "AND  la.idCompany = c.idCompany; " +
                "SELECT f.*, c.name FROM flashes f, companies c " +
                "WHERE f.idFlash IN (SELECT uf.idFlash FROM users_flashes uf WHERE uf.idUser = ? AND uf.status = 1) " +
                "AND  f.idCompany = c.idCompany; " +
                "SELECT t.*, c.name FROM tripods t, companies c " +
                "WHERE t.idTripod IN (SELECT ut.idTripod FROM users_tripods ut WHERE ut.idUser = ? AND ut.status = 1) " +
                "AND  t.idCompany = c.idCompany; " +
                "SELECT ta.*, c.name FROM t_adapters ta, companies c " +
                "WHERE ta.idTAdapter IN (SELECT uta.idTAdapter FROM users_t_adapters uta WHERE uta.idUser = ? AND uta.status = 1) " +
                "AND  ta.idCompany = c.idCompany; ",
                [repairer.idUser, repairer.idUser, repairer.idUser, repairer.idUser, repairer.idUser, repairer.idUser], (err, eq) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('my_equipment.html', {
                        User: repairer,
                        //name: req.query.id, 
                        eq: eq,
                    });
                });
        }
    });
    //res.status(200).render('my_equipment.html')
});

app.get('/sign_up', (req, res) => {
    res.status(200).render('sign_up.html')
});



app.get("/log_out", (req, res) => {
    auth.logout(res);
});

app.post('/user/log_in', urlencodedParser, (req, res) => {

    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${key} - ${value}`);
        map.set(key, value);
    });
    form.on('end', () => {
        console.log("end");
        const email = map.get("login");
        const password = map.get("pass");

        auth.authenticate(email, password, ok => {
            console.log(ok);
            if (!ok) {
                return res.status(401).render("log_in.html");
            }
            auth.login(email, res, user => {
                console.log("user", user);
                if (!user) {
                    // ?
                    console.log("500 error");
                    return res.status(500).render("log_in.html");
                }
                // res.render("successLogin.html", { repairer: user });
                //const last_page = req.cookies["last_page"];
                //res.clearCookie("last_page");
                res.redirect("/");
            });
        });

    });
});



app.post('/user/sign_up', urlencodedParser, (req, res) => {
    //authenticate
    console.log('/user/sign_up');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${key} - ${value}`);
        map.set(key, value);
    });
    form.on('end', () => {
        console.log("end");
        message = '_';
        auth.signup(
            map.get("login"),
            map.get("pass"),
            map.get("name"),
            function (res) {
                console.log("res:", res);
                if (res) {
                    console.log(res);
                    message = "OK!";
                    console.log(message);
                }
                else {
                    console.log(res);
                    message = "NOT OK!(((((((((((";
                    console.log(message);
                }
            }
        )

        res.status(200).render('user.html', { message, });

    });
});


app.get('/equipment', (req, res) => {

    console.log(req.query.equipment);
    console.log(req.query.select_body);
    if (!req.query.select_body) {
        //res.send('Please, first add a camera to your list :)');
        res.redirect('/bodies');
    }
    else {
        switch (req.query.equipment) {
            case 'lenses':
                console.log('ok', req.query.equipment);
                if (req.query.l_adapter) {
                    db.query('SELECT l.*, l.idLens as id, c.name ,COALESCE(AVG(cl.rating), 0) as av_rating FROM lenses l ' +
                        'INNER JOIN companies c ON l.idCompany = c.idCompany ' +
                        'LEFT JOIN comments_lenses cl ON l.idLens = cl.idLens ' +
                        'WHERE l.idLens IN (SELECT lab.idLens from lenses_adapters_bodies lab where idBody = ? AND idLAdapter = ?)  ' +
                        'GROUP BY l.model ' +
                        'ORDER BY av_rating DESC', [req.query.select_body, req.query.select_l_adapter], (err, results) => {
                            if (err) {
                                console.log('insert Error: ', err);
                                return;
                            }
                            res.status(200).render('equipment.html', {
                                results,
                                name: req.query.equipment,
                                name2: req.query.l_adapter,
                                link1: '/lenses/thelens/',
                            });
                        });
                }
                else {
                    db.query('SELECT l.*, l.idLens as id, c.name ,COALESCE(AVG(cl.rating), 0) as av_rating FROM lenses l ' +
                        'INNER JOIN companies c ON l.idCompany = c.idCompany ' +
                        'LEFT JOIN comments_lenses cl ON l.idLens = cl.idLens ' +
                        'WHERE l.idLens IN (SELECT lab.idLens from lenses_adapters_bodies lab where idBody = ?)  ' +
                        'GROUP BY l.model ' +
                        'ORDER BY av_rating DESC', [req.query.select_body], (err, results) => {
                            if (err) {
                                console.log('insert Error: ', err);
                                return;
                            }
                            res.status(200).render('equipment.html', {
                                results,
                                name: req.query.equipment,
                                link1: '/lenses/thelens/',
                            });
                        });
                }

                break;
            case 'flashes':
                console.log('ok', req.query.equipment);
                db.query('SELECT *, f.idFlash as id, c.name FROM flashes f ' +
                    'INNER JOIN companies c ON f.idCompany = c.idCompany ' +
                    'LEFT JOIN comments_flashes cf ON f.idFlash = cf.idFlash ' +
                    'WHERE f.idBody = ? ', [req.query.select_body], (err, results) => {
                        if (err) {
                            console.log('insert Error: ', err);
                            return;
                        }
                        res.status(200).render('equipment.html', {
                            results: results,
                            name: req.query.equipment,
                            link1: '/flashes/theflash/',
                        });
                    });
                break;
            case 'l_adapters':
                if (req.query.lens) {
                    console.log('ok', req.query.equipment);
                    db.query('SELECT la.*, la.idLAdapter as id, c.name ,COALESCE(AVG(cla.rating), 0) as av_rating FROM l_adapters la ' +
                        'INNER JOIN companies c ON la.idCompany = c.idCompany ' +
                        'LEFT JOIN comments_l_adapters cla ON la.idLAdapter = cla.idLAdapter ' +
                        'WHERE la.idLAdapter IN (SELECT lab.idLAdapter from lenses_adapters_bodies lab where idBody = ? AND idLens = ?)  ' +
                        'GROUP BY la.model ' +
                        'ORDER BY av_rating DESC', [req.query.select_body, req.query.select_lens], (err, results) => {
                            if (err) {
                                console.log('insert Error: ', err);
                                return;
                            }
                            res.status(200).render('equipment.html', {
                                results: results,
                                name: req.query.equipment,
                                name2: req.query.lens,
                                link1: '/l_adapters/thel_adapter/',
                            });
                        });
                } else {
                    db.query('SELECT la.*, la.idLAdapter as id, c.name ,COALESCE(AVG(cla.rating), 0) as av_rating FROM l_adapters la ' +
                        'INNER JOIN companies c ON la.idCompany = c.idCompany ' +
                        'LEFT JOIN comments_l_adapters cla ON la.idLAdapter = cla.idLAdapter ' +
                        'WHERE la.idLAdapter IN (SELECT lab.idLAdapter from lenses_adapters_bodies lab where idBody = ?)  ' +
                        'GROUP BY la.model ' +
                        'ORDER BY av_rating DESC', [req.query.select_body], (err, results) => {
                            if (err) {
                                console.log('insert Error: ', err);
                                return;
                            }
                            res.status(200).render('equipment.html', {
                                results: results,
                                name: req.query.equipment,
                                link1: '/l_adapters/thel_adapter/',
                            });
                        });
                }
                break;
            case 'tripods':
                console.log('ok', req.query.equipment);
                if (req.query.t_adapter) {
                    db.query('SELECT t.*, t.idTripod as id, c.name ,COALESCE(AVG(ct.rating), 0) as av_rating FROM tripods t ' +
                        'INNER JOIN companies c ON t.idCompany = c.idCompany ' +
                        'LEFT JOIN comments_tripods ct ON t.idTripod = ct.idTripod ' +
                        'WHERE t.idTripod IN (SELECT tab.idTripod from tripods_adapters_bodies tab where idBody = ? AND idTAdapter = ?)  ' +
                        'GROUP BY t.model ' +
                        'ORDER BY av_rating DESC', [req.query.select_body, req.query.select_t_adapter], (err, results) => {
                            if (err) {
                                console.log('insert Error: ', err);
                                return;
                            }
                            res.status(200).render('equipment.html', {
                                results0: results,
                                name: req.query.equipment,
                                name2: req.query.t_adapter,
                                link1: '/tripods/thetripod/',
                            });
                        });
                } else {
                    db.query('SELECT t.*, t.idTripod as id, c.name ,COALESCE(AVG(ct.rating), 0) as av_rating FROM tripods t ' +
                        'INNER JOIN companies c ON t.idCompany = c.idCompany ' +
                        'LEFT JOIN comments_tripods ct ON t.idTripod = ct.idTripod ' +
                        'WHERE t.idTripod IN (SELECT tab.idTripod from tripods_adapters_bodies tab where idBody = ?)  ' +
                        'GROUP BY t.model ' +
                        'ORDER BY av_rating DESC', [req.query.select_body], (err, results) => {
                            if (err) {
                                console.log('insert Error: ', err);
                                return;
                            }
                            res.status(200).render('equipment.html', {
                                results0: results,
                                name: req.query.equipment,
                                link1: '/tripods/thetripod/',
                            });
                        });
                }
                break;
            case 't_adapters':
                console.log('ok', req.query.equipment);
                if (req.query.tripod) {
                    db.query('SELECT ta.*, ta.idTAdapter as id, c.name ,COALESCE(AVG(cta.rating), 0) as av_rating FROM t_adapters ta ' +
                        'INNER JOIN companies c ON ta.idCompany = c.idCompany ' +
                        'LEFT JOIN comments_t_adapters cta ON ta.idTAdapter = cta.idTAdapter ' +
                        'WHERE ta.idTAdapter IN (SELECT tab.idTAdapter FROM tripods_adapters_bodies tab where idBody = ? AND idTripod = ?)  ' +
                        'GROUP BY ta.model ' +
                        'ORDER BY av_rating DESC', [req.query.select_body, req.query.select_tripod], (err, results) => {
                            if (err) {
                                console.log('insert Error: ', err);
                                return;
                            }
                            res.status(200).render('equipment.html', {
                                results: results,
                                name: req.query.equipment,
                                name2: req.query.tripod,
                                link1: '/t_adapters/thet_adapter/',
                            });
                        });
                } else {
                    db.query('SELECT ta.*, ta.idTAdapter as id, c.name ,COALESCE(AVG(cta.rating), 0) as av_rating FROM t_adapters ta ' +
                        'INNER JOIN companies c ON ta.idCompany = c.idCompany ' +
                        'LEFT JOIN comments_t_adapters cta ON ta.idTAdapter = cta.idTAdapter ' +
                        'WHERE ta.idTAdapter IN (SELECT tab.idTAdapter from tripods_adapters_bodies tab where idBody = ?)  ' +
                        'GROUP BY ta.model ' +
                        'ORDER BY av_rating DESC', [req.query.select_body], (err, results) => {
                            if (err) {
                                console.log('insert Error: ', err);
                                return;
                            }
                            res.status(200).render('equipment.html', {
                                results: results,
                                name: req.query.equipment,
                                link1: '/t_adapters/thet_adapter/',
                            });
                        });
                }
                break;
        }
    }
});

app.post('/bodies', (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req);

    var mod;
    form.on('field', (key, value) => {
        mod = value;
        console.log(mod);
    });

    form.on('end', () => {
        db.query("SELECT b.idBody, b.model, b.price, c.name AS body_company,  COALESCE(AVG(cb.rating), 0) as av_rating " +
            "FROM bodies b " +
            "INNER JOIN companies c ON b.idCompany = c.idCompany " +
            "LEFT JOIN comments_bodies cb ON b.idBody = cb.idBody " +
            "WHERE b.model like ? " +
            "GROUP BY b.model " +
            "ORDER BY av_rating DESC", ['%' + mod + '%'], (err, data) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('bodies.html', {
                    bodies: data,
                });
            });
    });
});

app.get('/:type', (req, res) => {
    const device = req.params.type;
    switch (device) {
        case 'bodies':
            db.query("SELECT b.idBody, b.model, b.price, c.name AS body_company,  COALESCE(AVG(cb.rating), 0) as av_rating " +
                "FROM bodies b " +
                "INNER JOIN companies c ON b.idCompany = c.idCompany " +
                "LEFT JOIN comments_bodies cb ON b.idBody = cb.idBody " +
                "GROUP BY b.model " +
                "ORDER BY av_rating DESC", (err, data) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('bodies.html', {
                        bodies: data,
                    });
                });
            break;
        case 'lenses':
            db.query("SELECT l.idLens, l.model, l.price, c.name AS lens_company,  COALESCE(AVG(cl.rating), 0) as av_rating " +
                "FROM lenses l " +
                "INNER JOIN companies c ON l.idCompany = c.idCompany " +
                "LEFT JOIN comments_lenses cl ON l.idLens = cl.idLens " +
                "GROUP BY l.model " +
                "ORDER BY av_rating DESC", (err, data) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('lenses.html', {
                        lenses: data,
                    });
                });
            break;
        case 'l_adapters':
            db.query("SELECT la.idLAdapter, la.model, la.price, c.name AS l_adapter_company,  COALESCE(AVG(cla.rating), 0) as av_rating " +
                "FROM l_adapters la " +
                "INNER JOIN companies c ON la.idCompany = c.idCompany " +
                "LEFT JOIN comments_l_adapters cla ON la.idLAdapter = cla.idLAdapter " +
                "GROUP BY la.model " +
                "ORDER BY av_rating DESC", (err, data) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('l_adapters.html', {
                        l_adapters: data,
                    });
                });
            break;
        case 'flashes':
            db.query("SELECT f.idFlash, f.model, f.price, c.name AS flash_company,  COALESCE(AVG(cf.rating), 0) as av_rating " +
                "FROM flashes f " +
                "INNER JOIN companies c ON f.idCompany = c.idCompany " +
                "LEFT JOIN comments_flashes cf ON f.idFlash = cf.idFlash " +
                "GROUP BY f.model " +
                "ORDER BY av_rating DESC", (err, data) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('flashes.html', {
                        flashes: data,
                    });
                });
            break;
        case 't_adapters':
            db.query("SELECT ta.idTAdapter, ta.model, ta.price, c.name AS t_adapter_company,  COALESCE(AVG(cta.rating), 0) as av_rating " +
                "FROM t_adapters ta " +
                "INNER JOIN companies c ON ta.idCompany = c.idCompany " +
                "LEFT JOIN comments_t_adapters cta ON ta.idTAdapter = cta.idTAdapter " +
                "GROUP BY ta.model " +
                "ORDER BY av_rating DESC", (err, data) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('t_adapters.html', {
                        t_adapters: data,
                    });
                });
            break;
        case 'tripods':
            db.query("SELECT t.idTripod, t.model, t.price, c.name AS tripod_company,  COALESCE(AVG(ct.rating), 0) as av_rating " +
                "FROM tripods t " +
                "INNER JOIN companies c ON t.idCompany = c.idCompany " +
                "LEFT JOIN comments_tripods ct ON t.idTripod = ct.idTripod " +
                "GROUP BY t.model " +
                "ORDER BY av_rating DESC", (err, data) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('tripods.html', {
                        tripods: data,
                    });
                });
            break;
        default:
            res.status(200).render('indexBody.html');
            break;
    }
});


app.get('/:type/comments', (req, res) => {
    const device = req.params.type;
    switch (device) {
        case 'bodies':
            db.query("SELECT c.*, u.login as author, b.model, co.name  FROM comments_bodies c, users u, bodies b, companies co " +
                "WHERE u.idUser = c.idUser AND b.idBody = c.idBody AND b.idCompany = co.idCompany ORDER BY c.date DESC", (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_bodies.html', {
                        comments: comments,
                    });
                });
            break;
        case 'lenses':
            db.query("SELECT c.*, u.login as author, l.model, co.name  FROM comments_lenses c, users u, lenses l, companies co " +
                "WHERE u.idUser = c.idUser AND l.idLens = c.idLens AND l.idCompany = co.idCompany ORDER BY c.date DESC", (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_lenses.html', {
                        comments: comments,
                    });
                });
            break;
        case 'l_adapters':
            db.query("SELECT c.*, u.login as author, la.model, co.name FROM comments_l_adapters c, users u, l_adapters la, companies co " +
                "WHERE u.idUser = c.idUser AND la.idLAdapter = c.idLAdapter AND la.idCompany = co.idCompany ORDER BY c.date DESC", (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_l_adapters.html', {
                        comments: comments,
                    });
                });
            break;
        case 'flashes':
            db.query("SELECT c.*, u.login as author, f.model, co.name FROM comments_flashes c, users u, flashes f, companies co " +
                "WHERE u.idUser = c.idUser AND f.idFlash = c.idFlash AND f.idCompany = co.idCompany ORDER BY c.date DESC", (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_flashes.html', {
                        comments: comments,
                    });
                });
            break;
        case 't_adapters':
            db.query("SELECT c.*, u.login as author, ta.model, co.name FROM comments_t_adapters c, users u, t_adapters ta, companies co " +
                "WHERE u.idUser = c.idUser AND ta.idTAdapter = c.idTAdapter AND ta.idCompany = co.idCompany ORDER BY c.date DESC", (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_t_adapters.html', {
                        comments: comments,
                    });
                });
            break;
        case 'tripods':
            db.query("SELECT c.*, u.login as author, t.model, co.name FROM comments_tripods c, users u, tripods t, companies co " +
                "WHERE u.idUser = c.idUser AND t.idTripod = c.idTripod AND t.idCompany = co.idCompany ORDER BY c.date DESC", (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_tripods.html', {
                        comments: comments,
                    });
                });
            break;
    }
});

/////////////////

app.get('/bodies/thebody', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT b.*, c.name as body_company  " +
                "FROM bodies b, companies c " +
                "WHERE b.idBody = ? AND c.idCompany = b.idCompany ;" +
                "Select status FROM users_bodies WHERE idBody = ? AND idUser = ?", [req.query.id, req.query.id, repairer.idUser], (err, body) => {
                    if (err) {
                        console.log('Error', err);
                        return;
                    }
                    console.log(body[1][0]);
                    if (body[1][0] && body[1][0].status == 1) {
                        res.render('thebody.html', {
                            bodies: body,
                            id: req.query.id,
                            namelink: "Delete",
                            idUser: repairer.idUser,
                        });
                    }
                    else if (!body[1][0]) {
                        res.render('thebody.html', {
                            bodies: body,
                            id: req.query.id,
                            namelink: "Add to my list",
                            idUser: repairer.idUser,
                        });
                    }
                    else {
                        res.render('thebody.html', {
                            bodies: body,
                            id: req.query.id,
                            namelink: "Add to my list again",
                            idUser: repairer.idUser,
                        });
                    }
                })
        }
    });
});

app.post('/bodies/thebody', urlencodedParser, (req, res) => {

    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${key} - ${value}`);
        map.set(key, value);
    });

    form.on('end', () => {
        switch (map.get('namelink')) {
            case "Add to my list":
                db.query("INSERT INTO users_bodies (idBody, idUser, status) Values (?, ?, 1)", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT b.*, c.name as body_company  " +
                        "FROM bodies b, companies c " +
                        "WHERE b.idBody = ? AND c.idCompany = b.idCompany ;" +
                        "Select status FROM users_bodies WHERE idBody = ? AND idUser = ?",
                        [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thebody.html', {
                                bodies: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Add to my list again":
                db.query("UPDATE users_bodies SET status=1 WHERE idBody = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT b.*, c.name as body_company  " +
                        "FROM bodies b, companies c " +
                        "WHERE b.idBody = ? AND c.idCompany = b.idCompany ;" +
                        "Select status FROM users_bodies WHERE idBody = ? AND idUser = ?",
                        [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thebody.html', {
                                bodies: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Delete":
                db.query("UPDATE users_bodies SET status = 0 WHERE idBody = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT b.*, c.name as body_company  " +
                        "FROM bodies b, companies c " +
                        "WHERE b.idBody = ? AND c.idCompany = b.idCompany ;" +
                        "Select status FROM users_bodies WHERE idBody = ? AND idUser = ?",
                        [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thebody.html', {
                                bodies: data,
                                id: map.get('idEq'),
                                namelink: "Add to my list again",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
        }
    });
    //"UPDATE users_bodies SET status=1 WHERE idUser = 1;"
});

app.get('/bodies/comments_thebody', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT c.*, u.login as author, b.model as model, co.name as name FROM comments_bodies c, users u, bodies b, companies co " +
                "WHERE c.idBody = ? AND u.idUser = c.idUser AND b.idBody = c.idBody AND b.idCompany = co.idCompany ", [req.query.id], (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_thebody.html', {
                        comments: comments,
                        name: req.query.id,
                        idUser: repairer.idUser,
                    });
                });
        }
    });
});

app.post('/bodies/comments_thebody', urlencodedParser, (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            //console.log(req.query.id);
            console.log('POST comments request');
            const form = new formidable.IncomingForm();
            form.parse(req);

            let map = new Map();
            form.on('field', (key, value) => {
                console.log(`${key} - ${value}`);
                map.set(key, value);
            });


            /*
            form.on('fileBegin', function (name, file){
                file.path = __dirname + '/uploads/' + file.name;
            });
            form.on('file', (name, file) => {
                console.log(`Uploaded ${file.name}`);
            });
            */
            form.on('end', () => {
                db.query("INSERT INTO comments_bodies (text, date, idUser, rating, idBody) Values (?, CURDATE(), ?, ?, ?)", [

                    map.get('text'),
                    map.get('author'),
                    map.get('rating'),
                    map.get('id'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT c.*, u.login as author, b.model, co.name  FROM comments_bodies c, users u, bodies b, companies co " +
                        "WHERE c.idBody = ? AND u.idUser = c.idUser AND b.idBody = c.idBody AND b.idCompany = co.idCompany ",
                        [map.get('id')], (err, comments) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('comments_thebody.html', {
                                comments: comments,
                                name: map.get('id'),
                                idUser: repairer.idUser,
                            });
                        });
                });
            });
        }
    });
});

/////////////////

app.get('/lenses/thelens', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT l.*, c.name as lens_company  " +
                "FROM lenses l, companies c " +
                "WHERE l.idLens = ? AND c.idCompany = l.idCompany ;" +
                "SELECT status FROM users_lenses WHERE idLens = ? AND idUser = ?", [req.query.id, req.query.id, repairer.idUser], (err, data) => {
                    if (err) {
                        console.log('Error', err);
                        return;
                    }
                    console.log(data[1][0]);
                    if (data[1][0] && data[1][0].status == 1) {
                        res.render('thelens.html', {
                            lenses: data,
                            id: req.query.id,
                            namelink: "Delete",
                            idUser: repairer.idUser,
                        });
                    }
                    else if (!data[1][0]) {
                        res.render('thelens.html', {
                            lenses: data,
                            id: req.query.id,
                            namelink: "Add to my list",
                            idUser: repairer.idUser,
                        });
                    }
                    else {
                        res.render('thelens.html', {
                            lenses: data,
                            id: req.query.id,
                            namelink: "Add to my list again",
                            idUser: repairer.idUser,
                        });
                    }
                })
        }
    });
});






app.post('/lenses/thelens', urlencodedParser, (req, res) => {

    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${key} - ${value}`);
        map.set(key, value);
    });

    form.on('end', () => {
        switch (map.get('namelink')) {
            case "Add to my list":
                db.query("INSERT INTO users_lenses (idLens, idUser, status) Values (?, ?, 1)", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT l.*, c.name as lens_company  " +
                        "FROM lenses l, companies c " +
                        "WHERE l.idLens = ? AND c.idCompany = l.idCompany; " +
                        "Select status FROM users_lenses WHERE idLens = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thelens.html', {
                                lenses: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Add to my list again":
                db.query("UPDATE users_lenses SET status=1 WHERE idLens = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT l.*, c.name as lens_company  " +
                        "FROM lenses l, companies c " +
                        "WHERE l.idLens = ? AND c.idCompany = l.idCompany; " +
                        "Select status FROM users_lenses WHERE idLens = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thelens.html', {
                                lenses: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Delete":
                db.query("UPDATE users_lenses SET status = 0 WHERE idLens = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT l.*, c.name as lens_company  " +
                        "FROM lenses l, companies c " +
                        "WHERE l.idLens = ? AND c.idCompany = l.idCompany; " +
                        "Select status FROM users_lenses WHERE idLens = ? AND idUser = ?",
                        [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thelens.html', {
                                lenses: data,
                                id: map.get('idEq'),
                                namelink: "Add to my list again",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
        }
    });
});


app.get('/lenses/comments_thelens', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT c.*, u.login as author, l.model, co.name  FROM comments_lenses c, users u, lenses l, companies co " +
                "WHERE c.idLens = ? AND u.idUser = c.idUser AND l.idLens = c.idLens AND l.idCompany = co.idCompany", [req.query.id], (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_thelens.html', {
                        comments: comments,
                        name: req.query.id,
                        idUser: repairer.idUser,
                    });
                });
        }
    });
});

app.post('/lenses/comments_thelens', urlencodedParser, (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            console.log('POST comments request');
            const form = new formidable.IncomingForm();
            form.parse(req);

            let map = new Map();
            form.on('field', (key, value) => {
                console.log(`${key} - ${value}`);
                map.set(key, value);
            });
            form.on('end', () => {
                db.query("INSERT INTO comments_lenses (text, date, idUser, rating, idLens) Values (?, CURDATE(), ?, ?, ?)", [
                    map.get('text'),
                    map.get('author'),
                    map.get('rating'),
                    map.get('id'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT c.*, u.login as author, l.model, co.name  FROM comments_lenses c, users u, lenses l, companies co " +
                        "WHERE c.idLens = ? AND u.idUser = c.idUser AND l.idLens = c.idLens AND l.idCompany = co.idCompany", [map.get('id')], (err, comments) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('comments_thelens.html', {
                                comments: comments,
                                name: map.get('id'),
                                idUser: repairer.idUser,
                            });
                        });
                });
            });
        }
    });
});

/////////////////

app.get('/l_adapters/thel_adapter', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT la.idLAdapter, la.model, la.price, c.name as l_adapter_company  " +
                "FROM l_adapters la, companies c " +
                "WHERE la.idLAdapter = ? AND c.idCompany = la.idCompany; " +
                "Select status FROM users_l_adapters WHERE idLAdapter = ? AND idUser = ?", [req.query.id, req.query.id, repairer.idUser], (err, data) => {
                    if (err) {
                        console.log('Error', err);
                        return;
                    }
                    console.log(data[1][0]);
                    if (data[1][0] && data[1][0].status == 1) {
                        res.render('thel_adapter.html', {
                            l_adapters: data,
                            id: req.query.id,
                            namelink: "Delete",
                            idUser: repairer.idUser,
                        });
                    }
                    else if (!data[1][0]) {
                        res.render('thel_adapter.html', {
                            l_adapters: data,
                            id: req.query.id,
                            namelink: "Add to my list",
                            idUser: repairer.idUser,
                        });
                    }
                    else {
                        res.render('thel_adapter.html', {
                            l_adapters: data,
                            id: req.query.id,
                            namelink: "Add to my list again",
                            idUser: repairer.idUser,
                        });
                    }
                })
        }
    });
});






app.post('/l_adapters/thel_adapter', urlencodedParser, (req, res) => {

    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${key} - ${value}`);
        map.set(key, value);
    });

    form.on('end', () => {
        switch (map.get('namelink')) {
            case "Add to my list":
                db.query("INSERT INTO users_l_adapters (idLAdapter, idUser, status) Values (?, ?, 1)", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT la.idLAdapter, la.model, la.price, c.name as l_adapter_company  " +
                        "FROM l_adapters la, companies c " +
                        "WHERE la.idLAdapter = ? AND c.idCompany = la.idCompany; " +
                        "Select status FROM users_l_adapters WHERE idLAdapter = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thel_adapter.html', {
                                l_adapters: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Add to my list again":
                db.query("UPDATE users_l_adapters SET status=1 WHERE idLAdapter = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT la.idLAdapter, la.model, la.price, c.name as l_adapter_company  " +
                        "FROM l_adapters la, companies c " +
                        "WHERE la.idLAdapter = ? AND c.idCompany = la.idCompany; " +
                        "Select status FROM users_l_adapters WHERE idLAdapter = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thel_adapter.html', {
                                l_adapters: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Delete":
                db.query("UPDATE users_l_adapters SET status = 0 WHERE idLAdapter = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT la.idLAdapter, la.model, la.price, c.name as l_adapter_company  " +
                        "FROM l_adapters la, companies c " +
                        "WHERE la.idLAdapter = ? AND c.idCompany = la.idCompany; " +
                        "Select status FROM users_l_adapters WHERE idLAdapter = ? AND idUser = ?",
                        [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thel_adapter.html', {
                                l_adapters: data,
                                id: map.get('idEq'),
                                namelink: "Add to my list again",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
        }
    });
});


app.get('/l_adapters/comments_thel_adapter', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT c.*, u.login as author, la.model, co.name FROM comments_l_adapters c, users u, l_adapters la, companies co " +
                "WHERE c.idLAdapter = ? AND u.idUser = c.idUser AND la.idLAdapter = c.idLAdapter AND la.idCompany = co.idCompany", [req.query.id], (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_thel_adapter.html', {
                        comments: comments,
                        name: req.query.id,
                        idUser: repairer.idUser,
                    });
                });
        }
    });
});

app.post('/l_adapters/comments_thel_adapter', urlencodedParser, (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            console.log('POST comments request');
            const form = new formidable.IncomingForm();
            form.parse(req);

            let map = new Map();
            form.on('field', (key, value) => {
                console.log(`${key} - ${value}`);
                map.set(key, value);
            });
            form.on('end', () => {
                db.query("INSERT INTO comments_l_adapters (text, date, idUser, rating, idLAdapter) Values (?, CURDATE(), ?, ?, ?)", [
                    map.get('text'),
                    map.get('author'),
                    map.get('rating'),
                    map.get('id'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT c.*, u.login as author, la.model, co.name FROM comments_l_adapters c, users u, l_adapters la, companies co " +
                        "WHERE c.idLAdapter = ? AND u.idUser = c.idUser AND la.idLAdapter = c.idLAdapter AND la.idCompany = co.idCompany", [map.get('id')], (err, comments) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('comments_thel_adapter.html', {
                                comments: comments,
                                name: map.get('id'),
                                idUser: repairer.idUser,
                            });
                        });
                });
            });
        }
    });
});

/////////////////

app.get('/flashes/theflash', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT f.*, f.price, c.name as flash_company  " +
                "FROM flashes f, companies c " +
                "WHERE f.idFlash = ? AND c.idCompany = f.idCompany; " +
                "Select status FROM users_flashes WHERE idFlash = ? AND idUser = ?", [req.query.id, req.query.id, repairer.idUser], (err, data) => {
                    if (err) {
                        console.log('Error', err);
                        return;
                    }
                    console.log(data[1][0]);
                    if (data[1][0] && data[1][0].status == 1) {
                        res.render('theflash.html', {
                            flashes: data,
                            id: req.query.id,
                            namelink: "Delete",
                            idUser: repairer.idUser,
                        });
                    }
                    else if (!data[1][0]) {
                        res.render('theflash.html', {
                            flashes: data,
                            id: req.query.id,
                            namelink: "Add to my list",
                            idUser: repairer.idUser,
                        });
                    }
                    else {
                        res.render('theflash.html', {
                            flashes: data,
                            id: req.query.id,
                            namelink: "Add to my list again",
                            idUser: repairer.idUser,
                        });
                    }
                })
        }
    });
});






app.post('/flashes/theflash', urlencodedParser, (req, res) => {

    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${key} - ${value}`);
        map.set(key, value);
    });

    form.on('end', () => {
        switch (map.get('namelink')) {
            case "Add to my list":
                db.query("INSERT INTO users_flashes (idFlash, idUser, status) Values (?, ?, 1)", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT f.*, f.price, c.name as flash_company  " +
                        "FROM flashes f, companies c " +
                        "WHERE f.idFlash = ? AND c.idCompany = f.idCompany; " +
                        "Select status FROM users_flashes WHERE idFlash = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('theflash.html', {
                                flashes: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Add to my list again":
                db.query("UPDATE users_flashes SET status=1 WHERE idFlash = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT f.*, f.price, c.name as flash_company  " +
                        "FROM flashes f, companies c " +
                        "WHERE f.idFlash = ? AND c.idCompany = f.idCompany; " +
                        "Select status FROM users_flashes WHERE idFlash = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('theflash.html', {
                                flashes: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Delete":
                db.query("UPDATE users_flashes SET status = 0 WHERE idFlash = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT f.*, f.price, c.name as flash_company  " +
                        "FROM flashes f, companies c " +
                        "WHERE f.idFlash = ? AND c.idCompany = f.idCompany; " +
                        "Select status FROM users_flashes WHERE idFlash = ? AND idUser = ?",
                        [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('theflash.html', {
                                flashes: data,
                                id: map.get('idEq'),
                                namelink: "Add to my list again",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
        }
    });
});


app.get('/flashes/comments_theflash', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT c.*, u.login as author, f.model, co.name FROM comments_flashes c, users u, flashes f, companies co " +
                "WHERE c.idFlash = ? AND u.idUser = c.idUser AND f.idFlash = c.idFlash AND f.idCompany = co.idCompany", [req.query.id], (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_theflash.html', {
                        comments: comments,
                        name: req.query.id,
                        idUser: repairer.idUser,
                    });
                });
        }
    });
});

app.post('/flashes/comments_theflash', urlencodedParser, (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            console.log('POST comments request');
            const form = new formidable.IncomingForm();
            form.parse(req);

            let map = new Map();
            form.on('field', (key, value) => {
                console.log(`${key} - ${value}`);
                map.set(key, value);
            });
            form.on('end', () => {
                db.query("INSERT INTO comments_flashes (text, date, idUser, rating, idFlash) Values (?, CURDATE(), ?, ?, ?)", [
                    map.get('text'),
                    map.get('author'),
                    map.get('rating'),
                    map.get('id'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT c.*, u.login as author, f.model, co.name FROM comments_flashes c, users u, flashes f, companies co " +
                        "WHERE c.idFlash = ? AND u.idUser = c.idUser AND f.idFlash = c.idFlash AND f.idCompany = co.idCompany", [map.get('id')], (err, comments) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('comments_theflash.html', {
                                comments: comments,
                                name: map.get('id'),
                                idUser: repairer.idUser,
                            });
                        });
                });
            });
        }
    });
});

/////////////////

app.get('/tripods/thetripod', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT t.idTripod, t.model, t.price, c.name as tripod_company  " +
                "FROM tripods t, companies c " +
                "WHERE t.idTripod = ? AND c.idCompany = t.idCompany; " +
                "Select status FROM users_tripods WHERE idTripod = ? AND idUser = ?", [req.query.id, req.query.id, repairer.idUser], (err, data) => {
                    if (err) {
                        console.log('Error', err);
                        return;
                    }
                    console.log(data[1][0]);
                    if (data[1][0] && data[1][0].status == 1) {
                        res.render('thetripod.html', {
                            tripods: data,
                            id: req.query.id,
                            namelink: "Delete",
                            idUser: repairer.idUser,
                        });
                    }
                    else if (!data[1][0]) {
                        res.render('thetripod.html', {
                            tripods: data,
                            id: req.query.id,
                            namelink: "Add to my list",
                            idUser: repairer.idUser,
                        });
                    }
                    else {
                        res.render('thetripod.html', {
                            tripods: data,
                            id: req.query.id,
                            namelink: "Add to my list again",
                            idUser: repairer.idUser,
                        });
                    }
                })
        }
    });
});






app.post('/tripods/thetripod', urlencodedParser, (req, res) => {

    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${key} - ${value}`);
        map.set(key, value);
    });

    form.on('end', () => {
        switch (map.get('namelink')) {
            case "Add to my list":
                db.query("INSERT INTO users_tripods (idTripod, idUser, status) Values (?, ?, 1)", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT t.idTripod, t.model, t.price, c.name as tripod_company  " +
                        "FROM tripods t, companies c " +
                        "WHERE t.idTripod = ? AND c.idCompany = t.idCompany; " +
                        "Select status FROM users_tripods WHERE idTripod = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thetripod.html', {
                                tripods: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Add to my list again":
                db.query("UPDATE users_tripods SET status=1 WHERE idTripod = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT t.idTripod, t.model, t.price, c.name as tripod_company  " +
                        "FROM tripods t, companies c " +
                        "WHERE t.idTripod = ? AND c.idCompany = t.idCompany; " +
                        "Select status FROM users_tripods WHERE idTripod = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thetripod.html', {
                                tripods: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Delete":
                db.query("UPDATE users_tripods SET status = 0 WHERE idTripod = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT t.idTripod, t.model, t.price, c.name as tripod_company  " +
                        "FROM tripods t, companies c " +
                        "WHERE t.idTripod = ? AND c.idCompany = t.idCompany; " +
                        "Select status FROM users_tripods WHERE idTripod = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thetripod.html', {
                                tripods: data,
                                id: map.get('idEq'),
                                namelink: "Add to my list again",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
        }
    });
});


app.get('/tripods/comments_thetripod', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT c.*, u.login as author, t.model, co.name FROM comments_tripods c, users u, tripods t, companies co " +
                "WHERE c.idTripod= ? AND u.idUser = c.idUser AND t.idTripod = c.idTripod AND t.idCompany = co.idCompany ", [req.query.id], (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_thetripod.html', {
                        comments: comments,
                        name: req.query.id,
                        idUser: repairer.idUser,
                    });
                });
        }
    });
});

app.post('/tripods/comments_thetripod', urlencodedParser, (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            console.log('POST comments request');
            const form = new formidable.IncomingForm();
            form.parse(req);

            let map = new Map();
            form.on('field', (key, value) => {
                console.log(`${key} - ${value}`);
                map.set(key, value);
            });
            form.on('end', () => {
                db.query("INSERT INTO comments_tripods (text, date, idUser, rating, idTripod) Values (?, CURDATE(), ?, ?, ?)", [
                    map.get('text'),
                    map.get('author'),
                    map.get('rating'),
                    map.get('id'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT c.*, u.login as author, t.model, co.name FROM comments_tripods c, users u, tripods t, companies co " +
                        "WHERE c.idTripod= ? AND u.idUser = c.idUser AND t.idTripod = c.idTripod AND t.idCompany = co.idCompany ", [map.get('id')], (err, comments) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('comments_thetripod.html', {
                                comments: comments,
                                name: map.get('id'),
                                idUser: repairer.idUser,
                            });
                        });
                });
            });
        }
    });
});

/////////////////

app.get('/t_adapters/thet_adapter', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT ta.idTAdapter, ta.model, ta.price, c.name as t_adapter_company  " +
                "FROM t_adapters ta, companies c " +
                "WHERE ta.idTAdapter = ? AND c.idCompany = ta.idCompany; " +
                "Select status FROM users_t_adapters WHERE idTAdapter = ? AND idUser = ?", [req.query.id, req.query.id, repairer.idUser], (err, data) => {
                    if (err) {
                        console.log('Error', err);
                        return;
                    }
                    console.log(data[1][0]);
                    if (data[1][0] && data[1][0].status == 1) {
                        res.render('thet_adapter.html', {
                            t_adapters: data,
                            id: req.query.id,
                            namelink: "Delete",
                            idUser: repairer.idUser,
                        });
                    }
                    else if (!data[1][0]) {
                        res.render('thet_adapter.html', {
                            t_adapters: data,
                            id: req.query.id,
                            namelink: "Add to my list",
                            idUser: repairer.idUser,
                        });
                    }
                    else {
                        res.render('thet_adapter.html', {
                            t_adapters: data,
                            id: req.query.id,
                            namelink: "Add to my list again",
                            idUser: repairer.idUser,
                        });
                    }
                })
        }
    });
});






app.post('/t_adapters/thet_adapter', urlencodedParser, (req, res) => {

    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${key} - ${value}`);
        map.set(key, value);
    });

    form.on('end', () => {
        switch (map.get('namelink')) {
            case "Add to my list":
                db.query("INSERT INTO users_t_adapters (idTAdapter, idUser, status) Values (?, ?, 1)", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT ta.idTAdapter, ta.model, ta.price, c.name as t_adapter_company  " +
                        "FROM t_adapters ta, companies c " +
                        "WHERE ta.idTAdapter = ? AND c.idCompany = ta.idCompany; " +
                        "Select status FROM users_t_adapters WHERE idTAdapter = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thet_adapter.html', {
                                t_adapters: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Add to my list again":
                db.query("UPDATE users_t_adapters SET status=1 WHERE idTAdapter = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT ta.idTAdapter, ta.model, ta.price, c.name as t_adapter_company  " +
                        "FROM t_adapters ta, companies c " +
                        "WHERE ta.idTAdapter = ? AND c.idCompany = ta.idCompany; " +
                        "Select status FROM users_t_adapters WHERE idTAdapter = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thet_adapter.html', {
                                t_adapters: data,
                                id: map.get('idEq'),
                                namelink: "Delete",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
            case "Delete":
                db.query("UPDATE users_t_adapters SET status = 0 WHERE idTAdapter = ? AND idUser = ?", [
                    map.get('idEq'),
                    map.get('idUser'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT ta.idTAdapter, ta.model, ta.price, c.name as t_adapter_company  " +
                        "FROM t_adapters ta, companies c " +
                        "WHERE ta.idTAdapter = ? AND c.idCompany = ta.idCompany; " +
                        "Select status FROM users_t_adapters WHERE idTAdapter = ? AND idUser = ?", [map.get('idEq'), map.get('idEq'), map.get('idUser')], (err, data) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('thet_adapter.html', {
                                t_adapters: data,
                                id: map.get('idEq'),
                                namelink: "Add to my list again",
                                idUser: map.get('idUser'),
                            });
                        });
                });
                break;
        }
    });
});


app.get('/t_adapters/comments_thet_adapter', (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            db.query("SELECT c.*, u.login as author, ta.model, co.name FROM comments_t_adapters c, users u, t_adapters ta, companies co " +
                "WHERE c.idTAdapter = ? AND u.idUser = c.idUser AND ta.idTAdapter = c.idTAdapter AND ta.idCompany = co.idCompany", [req.query.id], (err, comments) => {
                    if (err) {
                        console.log('Error: ', err);
                        return;
                    }
                    res.status(200).render('comments_thet_adapter.html', {
                        comments: comments,
                        name: req.query.id,
                        idUser: repairer.idUser,
                    });
                });
        }
    });
});

app.post('/t_adapters/comments_thet_adapter', urlencodedParser, (req, res) => {
    auth.isAuthenticated(req, repairer => {
        if (!repairer) {
            //res.cookie("last_page", req.url);
            return res.status(401).render('auth.html');
        } else {
            console.log('POST comments request');
            const form = new formidable.IncomingForm();
            form.parse(req);

            let map = new Map();
            form.on('field', (key, value) => {
                console.log(`${key} - ${value}`);
                map.set(key, value);
            });
            form.on('end', () => {
                db.query("INSERT INTO comments_t_adapters (text, date, idUser, rating, idTAdapter) Values (?, CURDATE(), ?, ?, ?)", [
                    map.get('text'),
                    map.get('author'),
                    map.get('rating'),
                    map.get('id'),
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    db.query("SELECT c.*, u.login as author, ta.model, co.name FROM comments_t_adapters c, users u, t_adapters ta, companies co " +
                        "WHERE c.idTAdapter = ? AND u.idUser = c.idUser AND ta.idTAdapter = c.idTAdapter AND ta.idCompany = co.idCompany", [map.get('id')], (err, comments) => {
                            if (err) {
                                console.log('Error: ', err);
                                return;
                            }
                            res.status(200).render('comments_thet_adapter.html', {
                                comments: comments,
                                name: map.get('id'),
                                idUser: repairer.idUser,
                            });
                        });
                });
            });
        }
    });
});

/////////////////



app.listen(3000);