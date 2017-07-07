const firebase = require('./firebase.js');

exports.dispatch = function( req, res ) {
    //const customer, subscription;
    const stripeEvent = req.body;
    const transaction = stripeEvent.data.object;
;

    if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.closed" ) {
        // Refund or dispute successfully processed
        // TODO: process refund

    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
        // Recurring Donations successfully made - log to firebase here.

        firebase.createDonation({
            donor: transaction.customer,
            amount: transaction.total / 100,
            transaction: transaction.charge
        }, transaction.subscription).then(() => {
            console.log('written');
        }).catch(( error ) => {
            console.log( error );
        });

    } else if ( stripeEvent.type === "customer.subscription.created" ) {
        // Customer started subscription. Kick off welcome emails here.

    } else if ( stripeEvent.type === "customer.subscription.deleted" ) {
        // Customer canceled subscription. Say thanks here.

    }

    res.sendStatus(200);
};
