# Email Notification Setup Guide

This application sends automated email notifications when mortgage applications are submitted.

## Setup Instructions

### 1. Create a Resend Account

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your Resend API Key

1. Log in to your Resend dashboard
2. Navigate to **API Keys** in the left sidebar
3. Click **Create API Key**
4. Give it a name (e.g., "HomeLoanAgents Production")
5. Copy the API key (it starts with `re_`)

### 3. Create a Resend Email Template (Optional)

To use custom designed email templates with your brand:

1. In your Resend dashboard, go to **Emails** > **Templates**
2. Click **Create Template**
3. Design your email template with these variables:
   - `{{applicant_name}}` - The applicant's full name
   - `{{application_id}}` - The unique application number
   - `{{submission_date}}` - When the application was submitted
   - `{{view_application_url}}` - Link for applicants to view their application status
4. Save the template and copy the Template ID (e.g., `template_abc123xyz`)

### 4. Configure Environment Variables

Update the `.env` file with your configuration:

```env
RESEND_API_KEY=re_your_actual_api_key_here
COMPANY_EMAIL=loans@yourdomain.com
COMPANY_NAME=HomeLoanAgents
RESEND_TEMPLATE_ID=template_abc123xyz
APP_URL=https://yourdomain.com
```

**Important Notes:**
- `RESEND_API_KEY`: Your Resend API key from step 2
- `COMPANY_EMAIL`: The email address where you want to receive new application notifications
- `COMPANY_NAME`: Your company name (used in email templates)
- `RESEND_TEMPLATE_ID`: (Optional) Your Resend template ID. If not provided, uses built-in HTML template
- `APP_URL`: Your application's URL for generating view application links

### 5. Add a Custom Domain (Optional but Recommended)

By default, Resend only allows sending emails to your own email address. To send to applicants:

1. In your Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Follow the DNS verification steps
5. Once verified, update the edge function to use your domain

**To use your custom domain:**

Edit `supabase/functions/send-application-email/index.ts` and change:

```typescript
from: `${companyName} <noreply@yourdomain.com>`
```

### 6. Testing

To test the email notifications:

1. Fill out and submit a test mortgage application
2. Check the applicant's email inbox for a confirmation email
3. Check your company email inbox for the notification

## How It Works

When an application is submitted:

1. **Application saved** → Data is stored in Supabase database with unique view token
2. **Applicant email** → Confirmation email with application number, next steps, and secure link to view status
3. **Company notification** → Alert email with applicant details and loan information

## Application Status Tracking

Applicants can track their application status using the secure link provided in their confirmation email:

- **View Token**: Each application gets a unique, secure token for public viewing
- **Status Page**: Shows current application status, timeline, and contact information
- **Status Updates**: Available statuses include:
  - `submitted` - Application received
  - `under_review` - Being reviewed by loan officer
  - `documents_requested` - Additional documents needed
  - `processing` - Application being processed
  - `approved` - Application approved
  - `denied` - Application denied
  - `closed` - Application closed/completed

To update an application status, modify the record in your Supabase dashboard.

## Email Templates

### Applicant Confirmation Email
- Application number for reference
- Summary of loan details
- Next steps in the process
- Contact information

### Company Notification Email
- Applicant contact information
- Complete loan details
- Direct link to database record
- Urgent action reminder

## Troubleshooting

**Emails not sending?**
- Verify `RESEND_API_KEY` is correct in `.env`
- Check Resend dashboard for error logs
- Ensure domain is verified (if using custom domain)
- Check browser console for error messages

**Only receiving one email?**
- Without a verified custom domain, Resend only sends to the email address associated with your account
- Add and verify a custom domain to send to applicants

**Need help?**
- Resend Documentation: [https://resend.com/docs](https://resend.com/docs)
- Check edge function logs in Supabase dashboard
