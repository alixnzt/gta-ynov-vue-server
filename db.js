"use strict";
const sqlite3 = require('sqlite3').verbose();

class Db {
    constructor(file) {
        this.db = new sqlite3.Database(file);
        this.createTableRequest();
        this.createTableTeam();
        this.createTableUser();
        this.createTableUserProfile();
    }
    
    //USER
    createTableUser() {
        const sql = 
            `CREATE TABLE IF NOT EXISTS user (
                id integer PRIMARY KEY, 
                name text, 
                email text UNIQUE, 
                password text,
                role text)`
        return this.db.run(sql);
    }

    selectUserByEmail(email, callback) {
        return this.db.get(`SELECT * FROM user WHERE email = ?`, 
        [email],(err,row) => {
            callback(err,row)
        })
    }

    selectAllUsers(callback) {
        return this.db.all(`SELECT * FROM user`, 
        (err,rows) => {
            callback(err,rows)
        })
    }

    insertUser(user, callback) {
        return this.db.run(
            'INSERT INTO user (name, email, password, role) VALUES (?,?,?,?)',
            user, (err) => {
                callback(err)
            })
    }

    //USER PROFILE
    createTableUserProfile() {
        const sql = 
            `CREATE TABLE IF NOT EXISTS userProfile (
                id integer PRIMARY KEY,
                firstname text,
                lastname text,
                birthdate text,
                phone phone,
                address text,
                postalCode integer,
                city text,
                userId integer)`
        return this.db.run(sql);
    }
    
    selectProfileById(userId, callback) {
        return this.db.get(`SELECT * FROM userProfile WHERE userId = ?`,
        [userId],(err,row) => {
            callback(err,row)
        })
    }

    //TEAM
    createTableTeam() {
        const sql = 
            `CREATE TABLE IF NOT EXISTS team (
                id integer PRIMARY KEY,
                userId integer,
                directorId integer)`
        return this.db.run(sql);
    }

    selectUserProfilesByDirector(userId, callback) {
        return this.db.all(`SELECT * FROM userProfile WHERE userId in (SELECT userId FROM team WHERE directorId = ?)`,
        [userId], (err, rows) => {
            callback(err,rows)
        })
    }

    //REQUEST
    createTableRequest() {
        const sql = 
            `CREATE TABLE IF NOT EXISTS request (
                id integer PRIMARY KEY,
                dateBegin text,
                dateEnd text,
                type text,
                reason text,
                status text,
                userId integer)`
        return this.db.run(sql);
    }

    selectRequestsByUserId(userId, status ,callback) {
        return this.db.all(`SELECT * FROM request WHERE userId = ? AND status = ?`,
        [userId, status], (err,rows) => {
            callback(err,rows)
        })
    }

    selectEmployeesRequests(userId, callback) {
        return this.db.all(`SELECT * FROM request WHERE status = 'waiting' and userId in (SELECT userId FROM team WHERE directorId = ?)`,
        [userId], (err, rows) => {
            callback(err,rows)
        })
    }

    insertRequest(event) {
        return this.db.run(
            `INSERT INTO request(dateBegin, dateEnd, type, reason, status, userId) VALUES (?,?,?,?,'waiting',?)`, event
        )
    }

    manageRequest(requestId, manage) {
        return this.db.run(
            `UPDATE request SET status = ? WHERE id = ?`, manage, requestId
        )
    }
}

module.exports = Db