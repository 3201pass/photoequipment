const mysql = require('mysql');
const connection = mysql.createConnection({
    user: 'photo',
    password: 'toor',
    host: '192.168.1.72',
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