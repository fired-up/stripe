// Get customer
// Create customer
// Create donations

const _ = require('lodash');
const firebase = require('firebase-admin');

const DONORS_REF = 'donors';

exports.getCustomer = ( email ) => {
    return new Promise(( resolve, reject ) => {
        // This will be a lot faster on FireStore
        firebase.database().ref( DONORS_REF )
            .once('value').then( snapshot => {
                const values = _.values( snapshot.val() );

                const customer = _.find( values, ( customer ) => {
                    const email = _.find( customer.email_addresses, ( email ) => {
                        return email.address === email;
                    });

                    return !!email;
                });

                resolve( customer || false );
            });
    });
}

exports.createCustomer = ( fields, customerID ) => {
    return new Promise(( resolve, reject ) => {
        const key = firebase.database().ref(DONORS_REF).push().key;
        const ref = firebase.database().ref( `${ DONORS_REF }/${ key }` );

        ref.set({
            employer: fields.employer,
            occupation: fields.employer,
            given_name: fields.given_name,
            family_name: fields.family_name,
            created_date: new Date(),
            modified_date: new Date(),
            identifiers: [
                `stripe:${ customerID }`
            ],
            email_addresses: [{
                primary: true,
                address: fields.email,
                address_type: 'Personal'
            }],
            postal_addresses: [{
                primary: true,
                address_type: 'Mailing',
                address_lines: [
                    fields.mailing_street1
                ],
                region: fields.mailing_region,
                country: fields.mailing_country,
                locality: fields.mailing_locality,
                postal_code: fields.mailing_postal_code
            }]
        })

        ref.once('value').then(() => {
            resolve();
        });
    })
}
