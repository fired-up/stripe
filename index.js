require('dotenv').config();
const cors = require('cors');
const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const stripe = require('./functions/library/stripe.js');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ID,
        privateKey: process.env.FIREBASE_KEY,
        clientEmail: process.env.FIREBASE_EMAIL
    }),
    databaseURL: process.env.FIREBASE_DATABASE
});

const app = express();
app.use( cors() );
app.use( bodyParser.json() );

app.post('/donate', function( req, res ) {
    console.log( req.body );

    stripe.single( req.body ).then(() => {
        res.status(200);
    })
});

app.listen(4000, function() {
    console.log('Example app listening on port 4000!')
});
