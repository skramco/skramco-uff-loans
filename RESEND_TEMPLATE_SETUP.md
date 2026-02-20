# Resend Template Setup Guide

This guide explains how to configure your Resend email template to work with the HomeLoanAgents application.

## Template Variables

Your Resend template should include these variables:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{applicant_name}}` | The applicant's full name | "John Smith" |
| `{{application_id}}` | The unique application number | "URLA-123456789" |
| `{{submission_date}}` | When the application was submitted | "January 25, 2026" |
| `{{view_application_url}}` | Link to view application status | "https://yourdomain.com/view-application?token=abc-123" |

## Template Example

Here's an example of how to use these variables in your Resend template:

```html
<div>
  <h1>Thank you for your home loan application!</h1>

  <p>Hi {{applicant_name}},</p>

  <p>Thank you for starting your home loan application with us!</p>

  <p>We've received your submission and one of our team members is reviewing it now.</p>

  <div style="background: #f0f0f0; padding: 15px; margin: 20px 0;">
    <strong>Application ID:</strong> {{application_id}}<br>
    <strong>Submitted On:</strong> {{submission_date}}
  </div>

  <p>To view your application status, click below:</p>

  <a href="{{view_application_url}}"
     style="display: inline-block; background: #0066cc; color: white;
            padding: 12px 24px; text-decoration: none; border-radius: 5px;">
    View Your Application
  </a>

  <p>If you have questions, reply to this email or call us.</p>

  <p>Best regards,<br>
  - The HomeLoanAgents Team</p>
</div>
```

## Configuration Steps

### 1. Create Template in Resend

1. Log in to [Resend Dashboard](https://resend.com/emails/templates)
2. Click **Create Template**
3. Name your template (e.g., "Home Loan Application Confirmation")
4. Design your email using the variables above
5. Click **Save Template**
6. Copy the **Template ID** (looks like `template_abc123xyz`)

### 2. Add Template ID to Environment

Add these lines to your `.env` file:

```env
RESEND_TEMPLATE_ID=template_abc123xyz
APP_URL=https://yourdomain.com
```

Replace:
- `template_abc123xyz` with your actual template ID from Resend
- `https://yourdomain.com` with your actual domain

### 3. Deploy the Edge Function

The edge function has already been configured to use your template automatically. Once you add the `RESEND_TEMPLATE_ID` environment variable, it will switch from the built-in HTML template to your custom Resend template.

## Testing Your Template

1. Submit a test application through your website
2. Check the email received
3. Verify all variables are populated correctly
4. Test the "View Your Application" button to ensure it works

## Fallback Behavior

If `RESEND_TEMPLATE_ID` is not set in your environment variables, the system will automatically fall back to the built-in HTML email template. This ensures emails are always sent even if the template isn't configured.

## Template Variables Reference

The edge function sends these exact values to Resend:

```javascript
{
  applicant_name: "John Smith",           // First name + Last name
  application_id: "URLA-123456789",      // Generated application number
  submission_date: "January 25, 2026",   // Long date format
  view_application_url: "https://yourdomain.com/view-application?token=abc-123"
}
```

## Troubleshooting

**Variables not showing in email?**
- Double-check variable names match exactly (case-sensitive)
- Ensure you're using double curly braces: `{{variable}}`
- Verify template ID is correct in `.env`

**Link not working?**
- Ensure `APP_URL` is set correctly in `.env`
- Check that the URL doesn't have a trailing slash
- Verify the view token is being generated (check database)

**Template not being used?**
- Confirm `RESEND_TEMPLATE_ID` is set in Supabase edge function secrets
- Check edge function logs for errors
- Verify template exists in Resend dashboard

## Support

For Resend template support:
- [Resend Template Documentation](https://resend.com/docs/dashboard/templates/introduction)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)
