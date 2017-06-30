// Get customer
// Create customer
// Create donations

const _ = require('lodash');
const firebase = require('firebase-admin');

const DONORS_REF = 'donors';

function getCustomer( email ) {
    return new Promise(( resolve, reject ) => {
        // This will be a lot faster on FireStore
        firebase.database().ref( DONORS_REF )
            .once('value').then( snapshot => {
                const values = _.values( snapshot.val() );

                const customer = _.find( values, ( customer ) => {
                    const email = _find( customer.email_addresses, ( email ) => {
                        return email.address === email;
                    });

                    return !!email;
                });

                if ( customer ) {
                    resolve( customer );
                } else {
                    resolve( false );
                }
            });
    });
}

function createCustomer( fields, customerID ) {
    return new Promise(( resolve, reject ) => {
        firebase.database.ref( DONORS_REF ).push({
            employer: fields.employer,
            given_name: fields.given_name,
            family_name: fields.family_name,
            created_date: fields.created_date,
            modified_date: fields.modified_date
            identifiers: [
                `stripe:${ customerID }`
            ],
            email_addresses: [{
                primary: true,
                address: fields.email,
                address_type: "Personal"
            }],
            postal_addresses: [{
                primary: true,
                address_type: "Mailing",
                address_lines: [
                    fields.mailing_street1
                ],
                region: fields.region,
                country: fields.country,
                locality: fields.locality,
                postal_code: fields.postal_code
            }]
        }).then(() => {
            resolve();
        }).error(( error ) => {
            reject( error );
        })
    })
}
