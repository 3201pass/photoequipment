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
//...
app.use(busboy()); 
const fileupload = require("express-fileupload")
// const cookieParser = require("cookie-parser");
// Creating the parser for data application/x-www-form-urlencoded
app.use(bodyParser.json());
const urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(urlencodedParser);
// app.use(express.static(__dirname + "/public"));

//var user = NULL;

nunjucks.configure('views', {
    autoescape: true,
    express: app
});``

app.get('/', (req, res) => {
    db.query('SELECT b.* from bodies b', (err, results) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        return;
                    }
                    res.status(200).render('indexBody.html', {
                        results,
                     });
                });

});

app.get('/log_in', (req, res) => {
    res.status(200).render('log_in.html')
});

app.get('/sign_up', (req, res) => {
    res.status(200).render('sign_up.html')
});

app.post( '/user/log_in', urlencodedParser, (req, res) =>{
    //authenticate
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
        map.set(key, value);
      });
      form.on('end', () => {
        console.log("end");
        message = '_';
        auth.authenticate(
        map.get("login"), 
        map.get("pass"), 
        function (ress){ 
            console.log("res:",ress);
            if (ress) {
                console.log(ress);
                message = "OK!"; 
                console.log(message);
            }    
            else {
                console.log(ress);
                message = "NOT OK!((((((((((("; 
                console.log(message);    
            }
            console.log(message);
            res.status(200).render('user.html', {message, } );
        }
        ) 
        
        
      });
});

app.post( '/user/sign_up', urlencodedParser, (req, res) =>{
    //authenticate
    console.log('/user/sign_up');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
        map.set(key, value);
      });
      form.on('end', () => {
        console.log("end");
        message = '_';
        auth.signup(
            map.get("login"), 
            map.get("pass"), 
            map.get("name"),
            function (res){ 
                console.log("res:",res);
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
       
          res.status(200).render('user.html', {message, } );
        
      });
});


app.get('/equipment', (req, res) => {

   console.log(req.query.equipment);
   console.log(req.query.select_body);

   switch(req.query.equipment) {
    case 'lenses':
        console.log('ok',req.query.equipment);
            db.query('SELECT l.*, l.idLens as id, c.name ,COALESCE(AVG(cl.rating), 0) as av_rating FROM lenses l ' +
                'INNER JOIN companies c ON l.idCompany = c.idCompany ' +
                'LEFT JOIN comments_lenses cl ON l.idLens = cl.idLens ' +
                'WHERE l.idLens IN (SELECT lab.idLens from lenses_adapters_bodies lab where idBody = ?)  ' +
                'GROUP BY l.model ' + 
                'ORDER BY av_rating DESC', [req.query.select_body ], (err, results) => {
                if (err) {
                    console.log('insert Error: ', err);
                    return;
                }
                res.status(200).render('equipment.html', {
                    results, 
                    name: req.query.equipment,
                    link1:'/lenses/thelens/',  
                });
            });
        
        break;
        case 'flashes':
        console.log('ok',req.query.equipment);
            db.query('SELECT *, f.idFlash as id, c.name FROM flashes f ' +
            'INNER JOIN companies c ON f.idCompany = c.idCompany ' +
            'LEFT JOIN comments_flashes cf ON f.idFlash = cf.idFlash ' +
            'WHERE f.idBody = ? ', [req.query.select_body ], (err, results) => {
                if (err) {
                    console.log('insert Error: ', err);
                    return;
                }
                res.status(200).render('equipment.html', {
                    results:results, 
                    name:req.query.equipment,  
                    link1:'/flashes/theflash/',
                });
            });
        break;
        case 'l_adapters':
        console.log('ok',req.query.equipment);
            db.query('SELECT la.*, la.idLAdapter as id, c.name ,COALESCE(AVG(cla.rating), 0) as av_rating FROM l_adapters la ' +
                'INNER JOIN companies c ON la.idCompany = c.idCompany ' +
                'LEFT JOIN comments_l_adapters cla ON la.idLAdapter = cla.idLAdapter ' +
                'WHERE la.idLAdapter IN (SELECT lab.idLAdapter from lenses_adapters_bodies lab where idBody = ?)  ' +
                'GROUP BY la.model ' + 
                'ORDER BY av_rating DESC', [req.query.select_body ], (err, results) => {
                if (err) {
                    console.log('insert Error: ', err);
                    return;
                }
                res.status(200).render('equipment.html', {
                    results: results, 
                    name: req.query.equipment, 
                    link1:'/l_adapters/thel_adapter/',
                });
            });
        break;
        case 'tripods':
        console.log('ok',req.query.equipment);
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
                    results0 :results, 
                    name: req.query.equipment, 
                    link1:'/tripods/thetripod/',
                });
            });
        break;
        case 't_adapters':
        console.log('ok',req.query.equipment);
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
                    results: results , 
                    name: req.query.equipment, 
                    link1:'/t_adapters/thet_adapter/',
                });
            });
        break;
   }
   /*
   const form = new formidable.IncomingForm();
   form.parse(req);
    name = '';
   //let map = new Map();
   form.on('field', (key, value) => {
       console.log(`${ key } - ${ value }`);
       name = value ;
       //map.set(key, value);
    });
    */
   
   // form.on('end', () => {
        //console.log('ok');
       /*
        console.log('map.size= ', map.size);
        //console.log(map.get('p_contents[]'));
        name = '';
        for (i=0; i<5; i=i+1)
        {
            if (map.get('p_contents['+i+']')) 
            {
                if (name != '')
                {
                name = name + ', ';
                }
                name = name + map.get('equipment');
            }
            
        } 
        //name = name.substring(0,name.length - 1);
        */
        //console.log('name:' ,name);
        /* db.query('SELECT * from ' + name, (err, ok) => {
            if (err) {
                console.log('insert Error: ', err);
                return;
            }
            res.status(200).render('equipment.html', {
                ok:ok, name:name 
            });
        });
        */
       //const data = await db.query('SELECT * FROM lenses');
       
   // });

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
    }
});
 
/////////////////

app.get('/bodies/thebody', (req, res) => {
    db.query("SELECT b.*, c.name as body_company  " +
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
    db.query("SELECT l.*, c.name as lens_company  " +
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
    db.query("SELECT f.*, f.price, c.name as flash_company  " +
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
         res.render('thet_adapter.html', {
             t_adapters: data,
              id: req.query.id,
            });
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



app.listen(3000);