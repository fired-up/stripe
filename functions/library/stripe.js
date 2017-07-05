// Private
// getCustomer - get customer from stripe
// updateCustomer - update customer on stripe
// verifyPlan - find or create or force update plan


// Public
// recurring

const _ = require('lodash');
const stripe = require('stripe')( process.env.STRIPE_PRIVATE );
const firebase = require('./firebase.js');

function createCustomer( fields ) {
    return new Promise(( resolve, reject ) => {
        // Metadata storage is nice for an redundent data layer for FEC rules
        // Address helps Stripe's fraud detection
        stripe.customers.create({
            email: fields.email,
            source: fields.token,
            description: `${ fields.given_name } ${ fields.family_name } <${ fields.email }>`,
            metadata: {
                created_date: new Date(),
                modified_date: new Date(),
                employer: fields.employer,
                occupation: fields.occupation
            },
            shipping: {
                name: `${ fields.firstname } ${ fields.lastname }`,
                address: {
                    line1: fields.mailing_street1,
                    city: fields.mailing_city,
                    state: fields.mailing_state,
                    postal_code: fields.mailing_zip,
                    country: fields.mailing_country
                }
            }
        }, ( error, customer ) => {
            if ( !error ) {
                firebase.createCustomer( fields, customer.id ).then(() => {
                    resolve( customer.id );
                });
            } else {
                reject( error );
            }
        })
    })
}

function updateCustomer( fields, customerID ) {
    return new Promise(( resolve, reject ) => {
        stripe.customers.update( customerID, {
            source: fields.token
        }, ( error, customer ) => {
            if ( !error ) {
                resolve( customerID );
            } else {
                reject( error );
            }
        });
    });
}

function findOrCreateCustomer( fields ) {
    return new Promise(( resolve, reject ) => {
        firebase.getCustomer( fields ).then(( customer ) => {
            if ( customer ) {
                let customerID = _.find( customer.identifiers, ( id ) => {
                    return id.indexOf('stripe:') !== -1;
                });

                if ( customerID ) {
                    customerID = customerID.replace('stripe:', '');

                    // Uses existing donor info but updates card number
                    updateCustomer( fields, customerID ).then(() => {
                        resolve( customerID );
                    });
                } else {
                    reject('CustomerID did not contain a Stripe Customer ID. Auto-creation of Stripe Customer is currently unsupported for existing donor objects');
                }
            } else {
                createCustomer( fields ).then(( customerID ) => {
                    resolve( customerID );
                });
            }
        }).catch(( error ) => {
            reject( error );
        })
    })
};

exports.single = ( fields ) => {
    return new Promise(( resolve, reject ) => {
        // TODO: This will use customers saved card. We want to connect
        // transactions to customer without saving their card for default
        findOrCreateCustomer( fields ).then(( customerID ) => {
            stripe.charges.create({
                amount: fields.amount * 100, // Amount is in cents
                currency: "usd",
                customer: customerID,
                description: "Donation to #####"
                // destination
            }, ( error, charge ) => {
                if ( !error && charge ) {
                    firebase.createDonation({
                        url: fields.url,
                        amount: fields.amount,
                        donor: customerID,
                        source: fields.source,
                        website: fields.website,
                        referrer: fields.referrer,
                        recipient: fields.recipient,
                        transaction: charge.id
                    }).then(() => {
                        resolve( charge.id );
                    });
                } else {
                    reject( error );
                }
            });
        }).catch(( error ) => {
            reject( error );
        });
    });
}
