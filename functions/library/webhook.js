exports.dispatch = function( req, res ) {
    var customer, subscription;

    var stripeEvent = req.body;
    var transaction = stripeEvent.data.object;


    if ( stripeEvent.type === "charge.refunded" || stripeEvent.type === "charge.dispute.closed" ) {
        //
        // Refund or dispute successfully processed
        //



    } else if ( stripeEvent.type === "invoice.payment_succeeded" ) {
        //
        // Recurring Donations successfully made
        //


    } else if ( stripeEvent.type === "customer.subscription.created" ) {

    } else if ( stripeEvent.type === "customer.subscription.deleted" ) {

    }

    res.send(200);
};
