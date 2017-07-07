exports.dispatch = function( req, res ) {
    var customer, subscription;

    var stripeEvent = req.body;
    var transaction = stripeEvent.data.object;

    console.log( stripeEvent );


    if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.closed" ) {
        //
        // Refund or dispute successfully processed
        //

        // TODO: process refund


    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
        //
        // Recurring Donations successfully made
        //

        //firebase.createDonation({
        // amount
        //
        //}, transaction.subscription.id)


    } else if ( stripeEvent.type === "customer.subscription.created" ) {
        //
        //
        //

    } else if ( stripeEvent.type === "customer.subscription.deleted" ) {
        //
        //
        //

    }

    res.send(200);
};
