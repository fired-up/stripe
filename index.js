require('dotenv').config();
const cors = require('cors');
const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

const stripe = require('./functions/library/stripe.js');
const webhook = require('./functions/library/webhook.js');

admin.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE,

    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ID,
        privateKey: process.env.FIREBASE_KEY,
        clientEmail: process.env.FIREBASE_EMAIL
    })
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

app.post('/stripe/webhook', webhook.dispatch);

app.post('/stripe/connect/start', stripe.startConnect);

app.post('/stripe/connect/complete', ( req, res ) => {
    stripe.finishConnect().then(() => {
        res.status(200).send({ status: 'success' });
    }).catch(( error ) => {
        res.status(200).send({ status: 'error', message: error })
    });
});


app.listen(4000, () => {
    console.log('Example app listening on port 4000!')
});
