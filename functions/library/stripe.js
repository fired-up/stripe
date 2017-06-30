// Private
//getCustomer - get customer from stripe
//updateCustomer - update customer on stripe
//verifyPlan - find or create or force update plan


// Public
// recurring


function createCustomer( fields ) {
    return new Promise(( resolve, reject ) => {
        stripe.customers.create({
            email: fields.email,
            source: fields.token,
            description: `${ fields.firstname } ${ fields.lastname } <${ fields.email }>`,
            metadata: {
                created_at: new Date()
            },
            shipping: {
                address: {
                    line1: fields.mailing_street1,
                    city: fields.mailing_city,
                    state: fields.mailing_state,
                    postal_code: fields.mailing_zip,
                    country: fields.mailing_country
                }
            }
        }).then(() = > {
            firebase.createCustomer( fields, customerID ).then(() => {
                resolve( customerID )
            })
        })
    })
}

function findOrCreateCustomer( fields ) {
    return new Promise(( resolve, reject ) => {
        firebase.getCustomer( fields.email ).then(( customer ) => {
            if ( customer ) {
                let customerID = _.find( customer.identifiers, ( id ) => {
                    return id.indexOf('stripe:') !== -1;
                });

                if ( customerID ) {
                    customerID = customerID.replace('stripe:', '');

                    resolve( customerID );
                } else {
                    reject('CustomerID did not contain a Stripe Customer ID. Auto-creation of Stripe Customer is currently unsupported for existing donor objects');
                }
            } else {
                createCustomer( fields ).then(( customerID ) => {
                    resolve( customerID );
                });
            }
        })
    })
};

export default function single( fields ) {
    return new Promise(( resolve, reject ) => {
        // TODO: This will use customers saved card. We want to connect
        // transactions to customer without saving their card for default
        findOrCreateCustomer( fields ).then(( customerID ) => {
            stripe.charges.create({
                amount: fields.amount * 100, // Amount is in cents
                currency: "usd",
                source: customerID,
                description: "Donation to #####"
                // destination
            }, ( error, charge ) {
                if ( !error && charge ) {
                    resolve( charge.id );
                } else {
                    resject( error );
                }
            });
        })
}
