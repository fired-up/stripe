// Get customer
// Create customer
// Create donations

const _ = require('lodash');
const firebase = require('firebase-admin');


// TODO: Make these configurable;
const DONORS_REF = 'donors';
const DONATIONS_REF = 'donations';
const PLATFORM_NAME = 'fired-up-donations';


exports.getCustomer = ( fields ) => {
    return new Promise(( resolve, reject ) => {
        // This will be a lot faster on FireStore
        firebase.database().ref( DONORS_REF )
            .once('value').then( snapshot => {
                const values = _.values( snapshot.val() );

                const customer = _.find( values, ( customer ) => {
                    const email_found = _.find( customer.email_addresses, ( email ) => {
                        return email.address === fields.email;
                    });

                    // We only re-associate a donor with an existing customerID
                    // if their details align near perfectly
                    return (
                        !!email_found &&
                        fields.given_name.toLowerCase() === customer.given_name.toLowerCase() &&
                        fields.family_name.toLowerCase() === customer.family_name.toLowerCase() &&
                        fields.mailing_region.toLowerCase() === customer.postal_addresses[0].region.toLowerCase() &&
                        fields.mailing_country.toLowerCase() === customer.postal_addresses[0].country.toLowerCase() &&
                        fields.mailing_locality.toLowerCase() === customer.postal_addresses[0].locality.toLowerCase() &&
                        fields.mailing_postal_code === customer.postal_addresses[0].postal_code
                    );
                });

                resolve( customer || false );
            }).catch(( error ) => {
                reject( error );
            });
    });
}

exports.createCustomer = ( fields, customerID ) => {
    return new Promise(( resolve, reject ) => {
        const key = firebase.database().ref( DONORS_REF ).push().key;
        const ref = firebase.database().ref( `${ DONORS_REF }/${ customerID }` );

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

exports.createDonation = ( fields ) => {
    return new Promise(( resolve, reject ) => {
        const key = firebase.database().ref(DONATIONS_REF).push().key;
        const ref = firebase.database().ref( `${ DONATIONS_REF }/${ key }` );

        ref.set({
            action_date: new Date(),
            created_date: new Date(),
            modified_date: new Date(),

            currency: 'USD',
            amount: fields.amount,

            voided: false,
            voided_date: null,
            credited_amount: 0,
            credited_date: null,

            url: fields.url,
            person: fields.donor,
            subscription_instance: null,
            origin_system: PLATFORM_NAME,

            identifiers: [
                `stripe:${ fields.transaction }`
            ],

            recipients: [{
                // legal_name:
                amount: fields.amount,
                display_name: fields.recipient
            }],

            payment: [{
                method: 'Credit Card',
                authorization_stored: true,
                reference_number: fields.transaction
            }],

            referrer_data: {
                //referrer: // person or group
                url: fields.referrer,
                source: fields.source,
                website: fields.website
            }
        });

        ref.once('value').then(() => {
            resolve();
        });
    });
}
