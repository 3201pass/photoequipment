const express = require('express');
const app = express();
const db = require('./db');
const nunjucks = require('nunjucks');
var router = express.Router();

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.get('/', (req, res) => {
     res.status(200).sendFile(__dirname + '/indexBody.html');
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
     case 'flashes':
     break;
     case 'adapters':
     break;
     case 'tripod':
     break;
 }
res.sendFile(__dirname + '/indexBody.html');
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
app.listen(3000);