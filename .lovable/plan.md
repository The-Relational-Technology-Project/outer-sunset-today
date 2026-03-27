

## Twilio SMS Compliance Updates

Two changes to pass Twilio Toll-Free Verification: update consent language in the sign-up forms and add an SMS section to the privacy page.

### 1. Update `ChannelFields` component in `/updates` (src/pages/Updates.tsx)

Make the consent checkbox text dynamic based on the selected channel:

- **"Text" or "Both" selected**: "I agree to receive text messages from Outer Sunset Today about the updates I requested. Msg frequency varies. Msg & data rates may apply. Reply STOP to cancel, HELP for help."
- **"Email" only**: "I agree to receive email updates from Outer Sunset Today about the updates I requested."

Ensure the checkbox is never pre-checked (already the case — `optIn` defaults to `false`). It's already required for form submission.

### 2. Add "Text Messages" section to Privacy & Terms (src/pages/PrivacyTerms.tsx)

Insert a new section between "Privacy" and "Terms of Use" with this content:

> **Text Messages**
>
> If you sign up for text message updates, we will only text you about the specific updates you requested. Message frequency varies depending on what you signed up for. Message and data rates may apply. You can text STOP at any time to stop receiving messages, or text HELP for support. We will not share your phone number with anyone. To get help, you can also email us at hello@relationaltechproject.org.

### Files changed
- `src/pages/Updates.tsx` — dynamic consent text in `ChannelFields`
- `src/pages/PrivacyTerms.tsx` — new "Text Messages" section

