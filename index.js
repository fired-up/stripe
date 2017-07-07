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

app.post('/donate/one', ( req, res ) => {
    stripe.single( req.body ).then(( chargeID ) => {
        res.status(200).send({ status: 'success', chargeID });
    }).catch(( error ) => {
        res.status(200).send({ status: 'error', message: error })
    })
});

app.post('/donate/recurring', ( req, res ) => {
    stripe.recurring( req.body ).then(( subscriptionID ) => {
        res.status(200).send({ status: 'success', subscriptionID });
    }).catch(( error ) => {
        res.status(200).send({ status: 'error', message: error })
    })
});

//app.post('/stripe/webhook', webhook.dispatc);


app.listen(4000, () => {
    console.log('Example app listening on port 4000!')
});
