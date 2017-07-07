# Fired Up Donate - Stripe Backend

This library allows you to process donations with stripe. While baseline functionality is included, you'll probably need to clone and customize some pieces. Features:

* Creates customers upon donation
* Create one time donations
* Create recurring donations
* Writes Donor, Donation, and Subscription data in OSDI format
* Writes data to Firebase Database

## Why Fired Up Donate/Stripe instead of another Stripe processor?

* Uses firebase cloud functions, which is free for X invocations
* ... So it runs on Google's cloud, which has remarkable uptime.
* Uses the Open Supporter Data Interface so data is portable
* _TODO: Process changes made in the Stripe UI. Including refunds, cancelling subscriptions, and reverting plan changes to prevent unexpected changes to uses subscriptions_
* _TODO: Works with Fired Up Donate Form out of the box_
* Verbose in communicating donor/donation transaction data to Stripe, so Stripe data can be exported or a Stripe analytics provider can provide value

## Library Usage

1) `yarn add fired-up-stripe`
2)

## Functions Usage

1) `git clone`
2) `firebase deploy`
3) Use `yourapphere.firebase.io/fup-stripe-donate` as the donation endpoint. Pass data like this:

```
{
    "amount":"25",
    "email":"test@test.com",
    "given_name":"Test",
    "family_name":"User",
    "mailing_street1":"Street Address 1",
    "mailing_locality":"Anytown",
    "mailing_postal_code":"00000",
    "mailing_region":"CA",
    "mailing_country":"US",
    "employer":"Test",
    "occupation":"Test",
    "use_mailing":true,
    "token":"tok_xxxxxxxxxxxxx",
    "url":"http://localhost/your-donate-page",
    "source":"refering_person_name",
    "website":"localhost:3000",
    "referrer":"http://localhost:3000/your-donate-page",
    "recipient":"Your Org Name Here"
}
```

## Development

### Webhooks

The freely-available [Ultrahook service](http://www.ultrahook.com/) makes building with webhooks a breeze. To develop in this repo, do the following:

1) `gem install ultrahook`
2) `ultrahook stripe 4000` (You may need to login/create an account here)
3) Add `https://stripe.%your-ultrahook-slug%.ultrahook.com/stripe/webhook`
4) Send test webhooks via the UI OR use stripe's testing info to simulate various recurring donation failures
