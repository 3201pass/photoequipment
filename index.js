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
app.get('/runt/:type',(req, res) => {
 const device = req.params.type;
 switch(device) {
     case 'body':
     break;
     case 'lenses':
     break;
     case 'l_adapters':
     break;
     case 'flashes':
     break;
     case 't_adapters':
     break;
     case 'tripod':
     break;
 }
res.status(200).render('indexBody.html');
});
app.get('/l', (req, res) => {
    res.send('Love my Anya! <3');
    db.query("SELECT...", (err, data) => {
        if (err) {
            console.log('Error', err);
            return;
        }
        // res.render('.../.html', {data: data, name: 'Igor'});
    })
});

app.get('/comments', (req, res) => {
    res.status(200).render('comment.html');
});

app.post('/comments', urlencodedParser, (req, res) => {
    console.log('POST comments request');
    const form = new formidable.IncomingForm();
    form.parse(req);
    // var fstream;
    // req.pipe(req.busboy);
    // req.busboy.on('file', function (fieldname, file, filename) {
    //     console.log("Uploading: " + filename); 
    //     fstream = fs.createWriteStream(__dirname + '/upload/' + filename);
    //     res.status(200).end('OK - File was uploaded successfully!');
    //     file.pipe(fstream);
    //     fstream.on('close', function () {
    //         res.status(500).end("Internal Error Server");
    //     });
    // });
    // req.busboy.on('finish', function() {
    //     // use req.body
    //     const city = req.body.city;
    //     const state = req.body.state;
    //     const zip = req.body.zip;
    //     console.log(`City: ${ city }, State: ${ state }, Zip: ${ zip }`);
    //   });

    form.on('field', (name, value) => {
        console.log(`${ name } - ${ value }`);
      });
    
    form.on('fileBegin', function (name, file){
        file.path = __dirname + '/uploads/' + file.name;
    });
      form.on('file', (name, file) => {
        console.log(`Uploaded ${file.name}`);
      });
    
      form.on('end', () => {
        res.status(200).end('OK - File was uploaded successfully!');
      });
});
app.listen(3000);