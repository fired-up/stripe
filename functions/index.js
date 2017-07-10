const admin = require('firebase-admin');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });

const stripe = require('./library/stripe.js');
const webhook = require('./library/webhook.js');

admin.initializeApp( functions.config().firebase );

exports.FUPDonateOnce = functions.https.onRequest( ( req, res ) => {
    cors(req, res, () => {
        stripe.single( req.body ).then(( chargeID ) => {
            res.status(200).send({ status: 'success', chargeID });
        }).catch(( error ) => {
            res.status(200).send({ status: 'error', message: error })
        })
    });
});

exports.FUPDonateMonthly = functions.https.onRequest( ( req, res ) => {
    cors(req, res, () => {
        stripe.recurring( req.body ).then(( subscriptionID ) => {
            res.status(200).send({ status: 'success', subscriptionID });
        }).catch(( error ) => {
            res.status(200).send({ status: 'error', message: error })
        })
    });
});

exports.FUPStripeConnectStart = functions.https.onRequest( ( req, res ) => {
    cors(req, res, () => {
        stripe.startConnect( req, res );
    });
});

exports.FUPStripeConnectComplete = functions.https.onRequest( ( req, res ) => {
    cors(req, res, () => {
        stripe.finishConnect(req.query.code, req.query.state).then(() => {
            res.status(200).send({ status: 'success' });
        }).catch(( error ) => {
            console.log( error );
            res.status(200).send({ status: 'error', message: error })
        });
    });
});

exports.FUPStripeWebhook = functions.https.onRequest( webhook.dispatch );
