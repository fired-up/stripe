const firebase = require('firebase-admin');
const functions = require('firebase-functions');

firebase.initializeApp( functions.config().firebase );

module.exports = require('./functions/library/stripe.js');
