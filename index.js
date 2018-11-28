"use strict";
const express = require('express');
const DB = require('./db');
const config = require('./config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors')

const db = new DB("sqlitedb")
const app = express();
const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

app.use(cors())

router.post('/register', (req, res) => {
    db.insertUser([
        req.body.name,
        req.body.email,
        bcrypt.hashSync(req.body.password, 10),
        req.body.role
    ],
    (err) => {
        if (err) return res.status(500).send("There was a problem registering the user.")
        db.selectUserByEmail(req.body.email, (err,user) => {
            if (err) return res.status(500).send("There was a problem getting user")
            let token = jwt.sign({ id: user.id }, config.secret, {expiresIn: 86400 // expires in 24 hours
            });
            res.status(200).send({ auth: true, token: token, user: user });
        }); 
    }); 
});

router.post('/login', (req, res) => {
    db.selectUserByEmail(req.body.email, (err, user) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!user) return res.status(404).send('No user found.');
        let passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
        let token = jwt.sign({ id: user.id }, config.secret, { expiresIn: 86400 // expires in 24 hours
        });
        res.status(200).send({ auth: true, token: token, user: user });
    });
});

router.post('/profile', (req, res) => {
    db.selectProfileById(req.body.userId, (err, userProfile) => {
        if (err) return res.status(500).send('Error on the server.');
        if (!userProfile) return res.status(404).send('No user profile found.');
        res.status(200).send({ auth: true, userProfile: userProfile });
    });
});

router.post('/create-request', (req, res) => {
    db.insertRequest([
        req.body.dateBegin,
        req.body.dateEnd,
        req.body.type,
        req.body.reason,
        req.body.userId,
    ],
    (err) => {
        if (err) return res.status(500).send("There was a problem registering the request.")
        db.selectRequestByUserId(req.body.userId, (err,request) => {
            if (err) return res.status(500).send("There was a problem getting user")
            res.status(200).send({ auth: true, request: request });
        }); 
    }); 
});

router.post('/retrieve-employees', (req, res) => {
    db.selectUserProfilesByDirector(req.body.directorId, (err, profile) => {
        if(err) return res.status(500).send('Error on the server.');
        if(!profile) return res.status(404).send('No requests found');
        res.status(200).send({ auth: true, profile: profile});
    })
})

//Récupération des requêtes par un salarié
router.post('/employe-requests', (req, res) => {
    db.selectRequestsByUserId(req.body.userId, req.body.status, (err, request) => {
        if(err) return res.status(500).send('Error on the server.');
        if(!request) return res.status(404).send('No requests found');
        res.status(200).send({ auth:true, request: request});
    });
});

//Récupération des requêtes salariés par un responsable d'équipe
router.post('/employees-requests', (req, res) => {
    db.selectEmployeesRequests(req.body.directorId, (err, request) => {
        if(err) return res.status(500).send('Error on the server.');
        if(!request) return res.status(404).send('No requests found');
        res.status(200).send({ auth: true, request: request});
    })
});

router.post('/manageRequests', (req, res) => {
    if(req.body.manage = true){
        db.manageRequest(req.body.requestId, 'validate');
        res.status(200).send('Status validated');
    }
    db.manageRequest(req.body.requestId, 'cancel');
    res.status(200).send('Status canceled');
});

app.use(router)

let port = process.env.PORT || 3000;

let server = app.listen(port, function() {
    console.log('Express server listening on port ' + port)
});