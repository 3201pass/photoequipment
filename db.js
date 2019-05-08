const mysql = require('mysql');
//const dotenv = require('dotenv').config();

const connection = mysql.createConnection({
    user: 'photo',
    password: 'toor',
    host: 'localhost',
    database: 'photo',
    multipleStatements: true,
    SECRET_KEY: "woo",
});

connection.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Database was connected!');
});
module.exports = connection;