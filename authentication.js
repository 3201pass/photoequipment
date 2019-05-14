const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jwt-simple');
const cookieParser = require('cookie-parser');
const db = require('./db');
const dotenv = require('dotenv').config();
var app = express()
app.use(cookieParser())

var salt = bcrypt.genSaltSync(10);

module.exports = {

    isAuthenticated: function (req, callback) {
        console.log("isAuthenticated");

        if (!req.cookies['access_token']) {
            callback(null);
            return;
        }
        const token = req.cookies['access_token'];
        try {


            const data = jwt.decode(token, "woo");
            console.log('data', data.login);
            db.query("SELECT idUser, login FROM users " +
                "WHERE login = ? ",
                [data.login], (err, repairers) => {
                    if (repairers[0]) {
                        callback(repairers[0]);
                        return;
                    }
                    callback(null);
                });
        }
        catch (err) {
            callback(null);
        }
    },

    authenticate: function (log, password, callback) {
        console.log("authenticate");
        db.query("SELECT password FROM Users WHERE login = ?", [log], (err, users) => {
            if (err) {
                console.log('500 error');
                callback(false);
                return;
            }
            if (!users[0]) {
                console.log('404 error');
                callback(false);
                return;
            }

            //bcrypt.hashSync(users[0].password, salt)
            bcrypt.compare(password, users[0].password, (err, valid) => {
                console.log('valid', valid);
                if (valid) {
                    callback(true);
                    return;
                }
                callback(false);
            });
        });
    },

    signup: function (log, password, name, callback) {
        console.log("signup");
        db.query("SELECT password FROM Users WHERE login = ?", [log], (err, users) => {
            if (err) {
                console.log('500 error');
                callback(false);
                return;
            }
            if (users[0]) {
                console.log('error: user already exist!');
                callback(false);
                return;
            }
            else {
                db.query("INSERT INTO Users (login, password, name) Values (?, ?, ?)", [
                    log,
                    bcrypt.hashSync(password, salt),
                    name,
                ], (err, ok) => {
                    if (err) {
                        console.log('insert Error: ', err);
                        callback(false);
                        return;
                    }
                    callback(true);
                    return;

                });

            }

        });
    },

    login: function (log, res, callback) {
        console.log("login");
        db.query("SELECT idUser, login " +
            "FROM Users WHERE login = ?", [log], (err, users) => {
                if (err) {
                    console.log('500 error');
                    callback(null);
                }
                console.log("login2");
                const token = jwt.encode(users[0], "woo"); // Sign token
                console.log("login3");
                res.cookie('access_token', token, {
                    expires: new Date(Date.now() + 12 * 60 * 60000), // 12 hours expire time
                });

                console.log("login4:", token);
                callback(users[0]);
            });
    },

    logout: function (res) {
        console.log("logout");
        res.clearCookie('access_token');
        res.redirect('/');
    }
}

