# Fired Up Donate - Stripe Backend

Allows you to process donations with stripe. Features:

* Creates customers upon donation
* Create one time donations
* Create recurring donations

## Library Usage

1) `yarn add fired-up-stripe`
2)

## Functions Usage

1) `git clone`
2) `firebase deploy`
3) Use `yourapphere.firebase.io/fup-stripe-donate` as the donation endpoint. Pass data like this:

```
    example donation data from fired
```

## Development

### Webhooks

The freely-available [Ultrahook service](http://www.ultrahook.com/) makes building with webhooks a breeze. To develop in this repo, do the following:

1) `gem install ultrahook`
2) `ultrahook stripe 4000` (You may need to login/create an account here)
3) Add `https://stripe.%your-ultrahook-slug%.ultrahook.com/stripe/webhook`
4) Send test webhooks via the UI OR use stripe's testing info to simulate various recurring donation failures
