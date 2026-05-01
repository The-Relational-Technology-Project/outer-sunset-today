
# Custom Alert Sending with Personal SMS Outreach

## How it works

When you trigger an alert for a custom update (from the admin dashboard):

- **Email subscribers** receive the alert message directly via Resend -- no intermediary.
- **SMS subscribers** do NOT get an auto-text. Instead, **you** get an email at joshuanesbit@gmail.com containing:
  - The alert description and message
  - Each phone subscriber's number
  - A clickable `sms:` link that opens your messaging app with the number and message pre-populated
  - The raw message for easy copy-paste

This preserves the personal, neighborly touch for texts while keeping email alerts instant.

## Implementation

### 1. New Edge Function: `send-custom-alert`

- Accepts: `update_id` (which custom update to alert) and `message` (the alert text)
- Protected by ADMIN_PASSWORD (same pattern as other admin functions)
- Uses service role to query `custom_update_subscriptions` for all subscribers of that update
- **Email subscribers**: sends them the alert directly via Resend (with 600ms delay between sends per rate-limit rules)
- **SMS subscribers**: collects their numbers, builds an HTML email with `sms:{number}?body={url-encoded message}` links, and sends that digest email to joshuanesbit@gmail.com
- **Both subscribers**: get the email directly + their phone number goes in the digest email to you
- Add `verify_jwt = false` in config.toml

### 2. Admin Dashboard Addition

Add a "Send Alert" section to the existing `/admin` page:
- Dropdown to select a custom update (fetched from `custom_updates` table)
- Text area for the alert message
- "Send Alert" button that calls the edge function
- Success/error feedback

### 3. Future automation hook

The edge function is designed so that a future cron job or trigger can call it with the same `update_id` + `message` parameters. When you're ready to automate specific alerts, we just need to build the condition-checking logic that invokes this same function -- no changes to the sending flow.

## What stays the same

- The `/updates` page and subscription flow are untouched
- No Twilio dependency needed
- Existing notification emails (new signup alerts to josh@relationaltechproject.org) continue as before
