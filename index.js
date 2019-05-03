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
/*
app.get('/:type',(req, res) => {
 const device = req.params.type;
 switch(device) {
     case 'bodies':
     break;
     case 'lenses':
     break;
     case 'l_adapters':
     break;
     case 'flashes':
     break;
     case 't_adapters':
     break;
     case 'tripods':
     break;
 }
res.status(200).render('indexBody.html');
});
*/

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
        break;
        case 'l_adapters':
        break;
        case 'flashes':
        break;
        case 't_adapters':
        break;
        case 'tripods':
        break;
    }
   });


app.get('/bodies', (req, res) => {
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
});

app.get('/lenses', (req, res) => {
    res.status(200).render('lenses.html');
});

app.get('/bodies/thebody', (req, res) => {
    db.query("SELECT b.idBody, b.model, b.price, c.name as body_company  " +
             "FROM bodies b, companies c " +
              "WHERE b.idBody = ? AND c.idCompany = b.idCompany ", [req.query.id], (err, body) => {
        if (err) {
            console.log('Error', err);
            return;
        }
         res.render('thebody.html', {body: body, name: req.query.id});
    })
});

app.get('/comments', (req, res) => {
    res.status(200).render('comment.html');
});

app.post('/comments', urlencodedParser, (req, res) => {
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);

    let map = new Map();
    form.on('field', (key, value) => {
        console.log(`${ key } - ${ value }`);
        map.set(key, value);
      });
    
    form.on('fileBegin', function (name, file){
        file.path = __dirname + '/uploads/' + file.name;
    });
      form.on('file', (name, file) => {
        console.log(`Uploaded ${file.name}`);
      });
    
      form.on('end', () => {
        db.query("INSERT INTO comments_bodies (text, date, author, rating, idBody) Values (?, CURDATE(), ?, ?, 2)", [
            map.get('text'), 
            map.get('author'),
            map.get('rating'),            
        ], (err, ok) => {
            if (err) {
                console.log('insert Error: ', err);
                return;
            }
            db.query("SELECT * from comments_bodies", (err, comments) => {
                if (err) {
                    console.log('Error: ', err);
                    return;
                }
                res.status(200).render('comments_bodies.html', {
                    comments: comments,
                });
            });
        });
      });
});
app.listen(3000);