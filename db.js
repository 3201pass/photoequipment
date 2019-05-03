const mysql = require('mysql');
const connection = mysql.createConnection({
    user: 'photo',
    password: 'toor',
    host: 'localhost',
    database: 'photo',
});

connection.connect((err) => {
    if (err) {
        console.log(err);
        return;
    }
    console.log('Database was connected!');
});
module.exports = connection;