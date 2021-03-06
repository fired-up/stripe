// Private
// getCustomer - get customer from stripe
// updateCustomer - update customer on stripe
// verifyPlan - find or create or force update plan


// Public
// recurring

const _ = require('lodash');
const qs = require('querystring');
const request = require('request');
const firebase = require('./firebase.js');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

const STRIPE_PRIVATE = typeof functions.config().stripe !== 'undefined' ? functions.config().stripe.private : process.env.STRIPE_PRIVATE;
const STRIPE_CLIENT = typeof functions.config().stripe !== 'undefined' ? functions.config().stripe.platform : process.env.STRIPE_CLIENT;

const stripe = require('stripe')( STRIPE_PRIVATE );

// TODO Make these configurable
const PLATFORM_NAME = 'fired-up-donations';
const STATEMENT_DESCRIPTOR = 'Donation'
const ALLOW_CONNECT_DESTINATION = true; // TODO: this should be disabled in library and enabled with config.


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

// Verify the presense of a plan called 'one' with a value of $1.
// It's possible for somebody to change this in Stripe's dashboard
// so this consistantly enforces it
function verifyPlan() {
    return new Promise(( resolve, reject ) => {
        var params = {
            name: 'One Dollar',
            amount: 100,
            currency: 'usd',
            interval: 'month',
            statement_descriptor: STATEMENT_DESCRIPTOR
        };

        stripe.plans.retrieve('one', ( error, plan ) => {
            if ( error ) {
                // THROW Plan was deleted!

                params.id = 'one';

                stripe.plans.create(params, ( error, plan ) => {
                    if ( error ) {
                        reject( error );
                    } else {
                        resolve();
                    }
                });

            } else {
                if ( plan.amount !== 100 || plan.interval !== 'month' || plan.currency !== 'usd' ) {
                    stripe.plans.update('one', params, ( error, plan ) => {
                        if ( error ) {
                            console.log(error);
                            reject( error );
                        } else {
                            resolve();
                        }
                    });

                    // TODO: This needs to notify the app admin better
                    console.error('¡Critical! Somebody is adjusting plan amounts in the Stripe.js dashboard which risks significantly overcharging donors cards. Please ensure no Stripe users are adjusting "Plan" parameters!')
                } else {
                    resolve();
                }
            }
        });
    });
};

// trustCustomerID is for applications where customerID is gathered via external process
// (ie this function is called like a library)
// We never want to trust a customer ID from a payment form though
exports.single = ( fields, trustCustomerID ) => {
    return new Promise(( resolve, reject ) => {

        // Process the donation once we have reconciled destination and customer
        const process = ( customerID, token ) => {
            let settings = {};

            let charge = {
                amount: fields.amount * 100, // Amount is in cents
                currency: 'usd',
                customer: customerID,
                description: `Donation to ${ fields.recipient }`
            };

            const next = ( error, charge ) => {
                if ( !error && charge ) {
                    firebase.createDonation({
                        url: fields.url,
                        donor: customerID,
                        amount: fields.amount,
                        source: fields.source,
                        parent: fields.parent,
                        transaction: charge.id,
                        website: fields.website,
                        campaign: fields.campaign,
                        referrer: fields.referrer,
                        recipient: fields.recipient
                    }).then(() => {
                        resolve( charge.id );
                    });
                } else {
                    reject( error );
                }
            }

            if ( fields.idempotency || fields.destination ) {
                if ( fields.idempotency ) {
                    settings.idempotency_key = fields.idempotency;
                }

                // Set the final direct charge details here
                if ( fields.destination && ALLOW_CONNECT_DESTINATION && token ) {
                    settings.stripe_account = fields.destination;

                    delete charge.customer;
                    charge.source = token.id;
                } else if ( fields.destination && ALLOW_CONNECT_DESTINATION && !token ) {
                    throw new Error('Destination was set but token was missing - not possible to process');
                }

                stripe.charges.create(charge, settings, next);
            } else {
                stripe.charges.create(charge, next);
            }
        };

        // If we're using a direct charge, we have get a token for the customer
        const routeTransaction = ( customerID ) => {
            if ( fields.destination && ALLOW_CONNECT_DESTINATION ) {
                stripe.tokens.create({
                    customer: customerID,
                }, {
                    stripe_account: fields.destination
                }).then(( token ) => {
                    process( customerID, token );
                });
            } else if (  fields.destination && ALLOW_CONNECT_DESTINATION ) {
                throw new Error('Destination was set but ALLOW_CONNECT_DESTINATION was false - not possible to process');
            } else {
                process( customerID );
            }
        }

        // If we call this API from a library and not a form, we can trust given customer ID
        if ( trustCustomerID && fields.customerID ) {
            routeTransaction( fields.customerID );
        } else {
            findOrCreateCustomer( fields )
                .then( routeTransaction )
                .catch(( error ) => {
                    reject( error );
                });
        }
    });
}

exports.recurring = ( fields ) => {
    return new Promise(( resolve, reject ) => {
        let customerID;

        verifyPlan()
            .then(() => {
                // TODO: Why doesn't `.then(findOrCreateCustomer())` not return in next param?
                return findOrCreateCustomer( fields )
                    .then(( id ) => {
                        customerID = id
                    })
            })
            .then(() => {
                stripe.customers.createSubscription(customerID, {
                    plan: 'one',
                    quantity: Math.floor( fields.amount )
                }, ( error, subscription ) => {
                    if ( !error && subscription ) {
                        firebase.createSubscription({
                            url: fields.url,
                            amount: fields.amount,
                            donor: customerID,
                            source: fields.source,
                            website: fields.website,
                            referrer: fields.referrer,
                            recipient: fields.recipient,
                            subscription: subscription.id
                        }).then(() => {
                            resolve( subscription.id );
                        })
                    } else {
                        reject( error );
                    }
                });
            });
    });
}

exports.startConnect = ( req, res ) => {
    firebase.createConnection( req.query.name ).then( ( key ) => {
        res.redirect('https://connect.stripe.com/oauth/authorize?' + qs.stringify({
            state: key,
            scope: 'read_write',
            response_type: 'code',
            client_id: STRIPE_CLIENT
        }));
    });
}

exports.finishConnect = ( code, state ) => {
    return new Promise(( resolve, reject ) => {
        firebase.getConnection( state ).then(() => {
            request.post({
                json: true,
                url: 'https://connect.stripe.com/oauth/token',
                form: {
                    code: code,
                    grant_type: 'authorization_code',
                    client_id: STRIPE_CLIENT,
                    client_secret: STRIPE_PRIVATE
                }
            }, ( error, response, body ) => {
                if ( !error && !body.error ) {
                    const stripeID = body.stripe_user_id;

                    firebase.completeConnection( state, stripeID ).then(() => {
                        resolve();
                    });
                } else {
                    reject( typeof body.error !== 'undefined' ? body.error : error );
                }
            });
        }).catch(( error ) => {
            // If connection wasn't previously authorized, reject request
            console.log('Couldn\'t Finish')
            reject( error );
        });
    });
}

exports.findOrCreateCustomer = findOrCreateCustomer;
