const express = require('express');
const app = express();
const db = require('./db');
const nunjucks = require('nunjucks');
var router = express.Router();
const fs = require('fs');
const bodyParser = require("body-parser");
const formidable = require('formidable');
const busboy = require('connect-busboy');
//...
app.use(busboy()); 
const fileupload = require("express-fileupload")
// const cookieParser = require("cookie-parser");
// Creating the parser for data application/x-www-form-urlencoded
app.use(bodyParser.json());
const urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);
// app.use(express.static(__dirname + "/public"));


nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/', (req, res) => {
     res.status(200).render('indexBody.html');
});
app.get('/equipment', (req, res) => {
    const name=req.query.search_things;
    const categories = req.query.categories;

    res.status(200).send(name, 'categories: ', categories);
});


app.get('/:type',(req, res) => {
 const device = req.params.type;
 switch(device) {
     case 'bodies':
        db.query("SELECT b.idBody, b.model, b.price, c.name AS body_company,  COALESCE(AVG(cb.rating), 0) as av_rating " +
                    "FROM bodies b "+
                    "INNER JOIN companies c ON b.idCompany = c.idCompany "+
                    "LEFT JOIN comments_bodies cb ON b.idBody = cb.idBody " +
                    "GROUP BY b.model " + 
                    "ORDER BY av_rating DESC" , (err, data) => {
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
                    "FROM lenses l "+
                    "INNER JOIN companies c ON l.idCompany = c.idCompany "+
                    "LEFT JOIN comments_lenses cl ON l.idLens = cl.idLens " +
                    "GROUP BY l.model " + 
                    "ORDER BY av_rating DESC" , (err, data) => {
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
                "FROM l_adapters la "+
                "INNER JOIN companies c ON la.idCompany = c.idCompany "+
                "LEFT JOIN comments_l_adapters cla ON la.idLAdapter = cla.idLAdapter " +
                "GROUP BY la.model " + 
                "ORDER BY av_rating DESC" , (err, data) => {
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
                "FROM flashes f "+
                "INNER JOIN companies c ON f.idCompany = c.idCompany "+
                "LEFT JOIN comments_flashes cf ON f.idFlash = cf.idFlash " +
                "GROUP BY f.model " + 
                "ORDER BY av_rating DESC" , (err, data) => {
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
                "FROM t_adapters ta "+
                "INNER JOIN companies c ON ta.idCompany = c.idCompany "+
                "LEFT JOIN comments_t_adapters cta ON ta.idTAdapter = cta.idTAdapter " +
                "GROUP BY ta.model " + 
                "ORDER BY av_rating DESC" , (err, data) => {
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
                "FROM tripods t "+
                "INNER JOIN companies c ON t.idCompany = c.idCompany "+
                "LEFT JOIN comments_tripods ct ON t.idTripod = ct.idTripod " +
                "GROUP BY t.model " + 
                "ORDER BY av_rating DESC" , (err, data) => {
            if (err) {
            console.log('Error: ', err);
            return;
            }
            res.status(200).render('tripods.html', {
                tripods: data,
            });
        });
     break;
     case 'cofrs':
        db.query("SELECT co.idCofr, co.model, co.price, c.name AS cofr_company,  COALESCE(AVG(cco.rating), 0) as av_rating " +
                "FROM cofrs co "+
                "INNER JOIN companies c ON co.idCompany = c.idCompany "+
                "LEFT JOIN comments_cofrs cco ON f.idCofr = cco.idCofr " +
                "GROUP BY co.model " + 
                "ORDER BY av_rating DESC" , (err, data) => {
            if (err) {
            console.log('Error: ', err);
            return;
            }
            res.status(200).render('cofrs.html', {
                cofrs: data,
            });
        });
     break;
     default: 
        res.status(200).render('indexBody.html');
     break;
 }
});


app.get('/:type/comments',(req, res) => {
    const device = req.params.type;
    switch(device) {
        case 'bodies':
            db.query("SELECT * from comments_bodies", (err, comments) => {
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
        db.query("SELECT * from comments_lenses", (err, comments) => {
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
            db.query("SELECT * from comments_l_adapters", (err, comments) => {
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
            db.query("SELECT * from comments_flashes", (err, comments) => {
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
            db.query("SELECT * from comments_t_adapters", (err, comments) => {
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
            db.query("SELECT * from comments_tripods", (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_tripods.html', {
                    comments: comments,
                });
            });
        break;
        case 'cofrs':
            db.query("SELECT * from comments_cofrs", (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_cofrs.html', {
                    comments: comments,
                });
            });
        break;
    }
});
 
/////////////////

app.get('/bodies/thebody', (req, res) => {
    db.query("SELECT b.idBody, b.model, b.price, c.name as body_company  " +
             "FROM bodies b, companies c " +
              "WHERE b.idBody = ? AND c.idCompany = b.idCompany ", [req.query.id], (err, body) => {
        if (err) {
            console.log('Error', err);
            return;
        }
         res.render('thebody.html', {bodies: body, id: req.query.id});
    })
    
});

app.get('/bodies/comments_thebody', (req, res) => {
    db.query("SELECT * FROM comments_bodies c WHERE c.idBody = ? ", [req.query.id], (err, comments) => {
        if (err) {
            console.log('Error: ', err);
            return;
        }
        res.status(200).render('comments_thebody.html', {
            comments: comments, name: req.query.id, 
        });
    });
});

app.post('/bodies/comments_thebody', urlencodedParser, (req, res) => {
    //console.log(req.query.id);
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
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
        db.query("INSERT INTO comments_bodies (text, date, author, rating, idBody) Values (?, CURDATE(), ?, ?, ?)", [
            
            map.get('text'), 
            map.get('author'),
            map.get('rating'),  
            map.get('id'),    
            ], (err, ok) => {
            if (err) {
                console.log('insert Error: ', err);
                return;
            }
            db.query("SELECT * from comments_bodies c WHERE c.idBody= ? ", [map.get('id')], (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_thebody.html', {
                    comments: comments, name: map.get('id'),
                });
            });
        });
      });
});

/////////////////

app.get('/lenses/thelens', (req, res) => {
    db.query("SELECT l.idLens, l.model, l.price, c.name as lens_company  " +
             "FROM lenses l, companies c " +
              "WHERE l.idLens = ? AND c.idCompany = l.idCompany ", [req.query.id], (err, data) => {
        if (err) {
            console.log('Error', err);
            return;
        }
         res.render('thelens.html', {lenses: data, id: req.query.id});
    })
    
});

app.get('/lenses/comments_thelens', (req, res) => {
    db.query("SELECT * FROM comments_lenses c WHERE c.idLens = ? ", [req.query.id], (err, comments) => {
        if (err) {
            console.log('Error: ', err);
            return;
        }
        res.status(200).render('comments_thelens.html', {
            comments: comments, name: req.query.id, 
        });
    });
});

app.post('/lenses/comments_thelens', urlencodedParser, (req, res) => {
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
        map.set(key, value);
      });
      form.on('end', () => {
        db.query("INSERT INTO comments_lenses (text, date, author, rating, idLens) Values (?, CURDATE(), ?, ?, ?)", [
            map.get('text'), 
            map.get('author'),
            map.get('rating'),  
            map.get('id'),    
            ], (err, ok) => {
            if (err) {
                console.log('insert Error: ', err);
                return;
            }
            db.query("SELECT * from comments_lenses c WHERE c.idLens= ? ", [map.get('id')], (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_thelens.html', {
                    comments: comments, name: map.get('id'),
                });
            });
        });
      });
});

/////////////////

app.get('/l_adapters/thel_adapter', (req, res) => {
    db.query("SELECT la.idLAdapter, la.model, la.price, c.name as l_adapter_company  " +
             "FROM l_adapters la, companies c " +
              "WHERE la.idLAdapter = ? AND c.idCompany = la.idCompany ", [req.query.id], (err, data) => {
        if (err) {
            console.log('Error', err);
            return;
        }
         res.render('thel_adapter.html', {l_adapters: data, id: req.query.id});
    })
    
});

app.get('/l_adapters/comments_thel_adapter', (req, res) => {
    db.query("SELECT * FROM comments_l_adapters c WHERE c.idLAdapter = ? ", [req.query.id], (err, comments) => {
        if (err) {
            console.log('Error: ', err);
            return;
        }
        res.status(200).render('comments_thel_adapter.html', {
            comments: comments, name: req.query.id, 
        });
    });
});

app.post('/l_adapters/comments_thel_adapter', urlencodedParser, (req, res) => {
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
        map.set(key, value);
      });
      form.on('end', () => {
        db.query("INSERT INTO comments_l_adapters (text, date, author, rating, idLAdapter) Values (?, CURDATE(), ?, ?, ?)", [
            map.get('text'), 
            map.get('author'),
            map.get('rating'),  
            map.get('id'),    
            ], (err, ok) => {
            if (err) {
                console.log('insert Error: ', err);
                return;
            }
            db.query("SELECT * from comments_l_adapters c WHERE c.idLAdapter= ? ", [map.get('id')], (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_thel_adapter.html', {
                    comments: comments, name: map.get('id'),
                });
            });
        });
      });
});

/////////////////

app.get('/flashes/theflash', (req, res) => {
    db.query("SELECT f.idFlash, f.model, f.price, c.name as flash_company  " +
             "FROM flashes f, companies c " +
              "WHERE f.idFlash = ? AND c.idCompany = f.idCompany ", [req.query.id], (err, data) => {
        if (err) {
            console.log('Error', err);
            return;
        }
         res.render('theflash.html', {flashes: data, id: req.query.id});
    })
    
});

app.get('/flashes/comments_theflash', (req, res) => {
    db.query("SELECT * FROM comments_flashes c WHERE c.idFlash = ? ", [req.query.id], (err, comments) => {
        if (err) {
            console.log('Error: ', err);
            return;
        }
        res.status(200).render('comments_theflash.html', {
            comments: comments, name: req.query.id, 
        });
    });
});

app.post('/flashes/comments_theflash', urlencodedParser, (req, res) => {
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
        map.set(key, value);
      });
      form.on('end', () => {
        db.query("INSERT INTO comments_flashes (text, date, author, rating, idFlash) Values (?, CURDATE(), ?, ?, ?)", [
            map.get('text'), 
            map.get('author'),
            map.get('rating'),  
            map.get('id'),    
            ], (err, ok) => {
            if (err) {
                console.log('insert Error: ', err);
                return;
            }
            db.query("SELECT * from comments_flashes c WHERE c.idFlash= ? ", [map.get('id')], (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_theflash.html', {
                    comments: comments, name: map.get('id'),
                });
            });
        });
      });
});

/////////////////

app.get('/tripods/thetripod', (req, res) => {
    db.query("SELECT t.idTripod, t.model, t.price, c.name as tripod_company  " +
             "FROM tripods t, companies c " +
              "WHERE t.idTripod = ? AND c.idCompany = t.idCompany ", [req.query.id], (err, data) => {
        if (err) {
            console.log('Error', err);
            return;
        }
         res.render('thetripod.html', {tripods: data, id: req.query.id});
    })
    
});

app.get('/tripods/comments_thetripod', (req, res) => {
    db.query("SELECT * FROM comments_tripods c WHERE c.idTripod = ? ", [req.query.id], (err, comments) => {
        if (err) {
            console.log('Error: ', err);
            return;
        }
        res.status(200).render('comments_thetripod.html', {
            comments: comments, name: req.query.id, 
        });
    });
});

app.post('/tripods/comments_thetripod', urlencodedParser, (req, res) => {
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
        map.set(key, value);
      });
      form.on('end', () => {
        db.query("INSERT INTO comments_tripods (text, date, author, rating, idTripod) Values (?, CURDATE(), ?, ?, ?)", [
            map.get('text'), 
            map.get('author'),
            map.get('rating'),  
            map.get('id'),    
            ], (err, ok) => {
            if (err) {
                console.log('insert Error: ', err);
                return;
            }
            db.query("SELECT * from comments_tripods c WHERE c.idTripod= ? ", [map.get('id')], (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_thetripod.html', {
                    comments: comments, name: map.get('id'),
                });
            });
        });
      });
});

/////////////////

app.get('/t_adapters/thet_adapter', (req, res) => {
    db.query("SELECT ta.idTAdapter, ta.model, ta.price, c.name as t_adapter_company  " +
             "FROM t_adapters ta, companies c " +
              "WHERE ta.idTAdapter = ? AND c.idCompany = ta.idCompany ", [req.query.id], (err, data) => {
        if (err) {
            console.log('Error', err);
            return;
        }
         res.render('thet_adapter.html', {t_adapters: data, id: req.query.id});
    })
    
});

app.get('/t_adapters/comments_thet_adapter', (req, res) => {
    db.query("SELECT * FROM comments_t_adapters c WHERE c.idTAdapter = ? ", [req.query.id], (err, comments) => {
        if (err) {
            console.log('Error: ', err);
            return;
        }
        res.status(200).render('comments_thet_adapter.html', {
            comments: comments, name: req.query.id, 
        });
    });
});

app.post('/t_adapters/comments_thet_adapter', urlencodedParser, (req, res) => {
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
        map.set(key, value);
      });
      form.on('end', () => {
        db.query("INSERT INTO comments_t_adapters (text, date, author, rating, idTAdapter) Values (?, CURDATE(), ?, ?, ?)", [
            map.get('text'), 
            map.get('author'),
            map.get('rating'),  
            map.get('id'),    
            ], (err, ok) => {
            if (err) {
                console.log('insert Error: ', err);
                return;
            }
            db.query("SELECT * from comments_t_adapters c WHERE c.idTAdapter= ? ", [map.get('id')], (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_thet_adapter.html', {
                    comments: comments, name: map.get('id'),
                });
            });
        });
      });
});

/////////////////

app.get('/cofrs/thecofr', (req, res) => {
    db.query("SELECT co.idCofr, co.model, co.price, c.name as cofr_company  " +
             "FROM cofrs co, companies c " +
              "WHERE co.idCofr = ? AND c.idCompany = co.idCompany ", [req.query.id], (err, data) => {
        if (err) {
            console.log('Error', err);
            return;
        }
         res.render('thecofr.html', {cofrs: data, id: req.query.id});
    })
    
});




app.listen(3000);