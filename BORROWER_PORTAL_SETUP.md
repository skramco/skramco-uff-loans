# Borrower Portal Setup Guide

This guide explains how to set up and use the borrower authentication and portal system.

## Overview

The borrower portal allows borrowers to:
- Create an account and login securely
- View their loan applications
- Track loan conditions
- Upload documents for specific conditions
- Monitor their application status

## Database Schema

The following tables have been created:

### `borrower_profiles`
Stores borrower profile information, linked to Supabase auth.users
- `id` - UUID, references auth.users
- `first_name` - Borrower's first name
- `last_name` - Borrower's last name
- `email` - Borrower's email address
- `created_at` - Timestamp
- `updated_at` - Timestamp

### `loans`
Stores loan information
- `id` - UUID, primary key
- `borrower_id` - UUID, foreign key to borrower_profiles
- `vesta_loan_id` - Optional external loan ID
- `status` - Loan status (Active, Pending, etc.)
- `loan_amount` - Loan amount
- `loan_type` - Type of loan
- `property_address` - Property address
- `created_at` - Timestamp
- `updated_at` - Timestamp

### `conditions`
Stores loan conditions that need to be fulfilled
- `id` - UUID, primary key
- `loan_id` - UUID, foreign key to loans
- `title` - Condition title
- `description` - Detailed description
- `status` - Open, Submitted, or Cleared
- `responsible_party` - Borrower or Lender
- `due_date` - Optional due date
- `created_at` - Timestamp
- `updated_at` - Timestamp

### `documents`
Stores uploaded documents
- `id` - UUID, primary key
- `loan_id` - UUID, foreign key to loans
- `condition_id` - UUID, optional foreign key to conditions
- `file_name` - Original file name
- `file_url` - URL to the uploaded file
- `file_size` - File size in bytes
- `file_type` - MIME type
- `uploaded_by` - UUID, foreign key to auth.users
- `created_at` - Timestamp

## Storage Setup

A Supabase Storage bucket named `loan-documents` needs to be created for document uploads.

### Creating the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Click "Create a new bucket"
4. Enter the following details:
   - Name: `loan-documents`
   - Public: **NO** (documents should be private)
   - File size limit: 26214400 (25MB)
   - Allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`

### Storage Policies

The following RLS policies need to be created for the storage bucket:

**Upload Policy:**
```sql
CREATE POLICY "Borrowers can upload documents to own loans"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'loan-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM loans WHERE borrower_id = auth.uid()
    )
  );
```

**View Policy:**
```sql
CREATE POLICY "Borrowers can view own loan documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'loan-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM loans WHERE borrower_id = auth.uid()
    )
  );
```

**Delete Policy:**
```sql
CREATE POLICY "Borrowers can delete own uploaded documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'loan-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM loans WHERE borrower_id = auth.uid()
    )
  );
```

## Creating Test Data

To test the borrower portal, you'll need to create some test data:

### 1. Create a Test Borrower

First, register a new borrower account:
1. Go to `/register`
2. Fill in the registration form
3. Submit to create the account

Alternatively, create directly in the database:

```sql
-- Create auth user (this is handled by Supabase Auth when registering)
-- Then create the profile:
INSERT INTO borrower_profiles (id, first_name, last_name, email)
VALUES (
  'YOUR_USER_ID_FROM_AUTH_USERS',
  'John',
  'Doe',
  'john@example.com'
);
```

### 2. Create a Test Loan

```sql
INSERT INTO loans (borrower_id, vesta_loan_id, status, loan_amount, loan_type, property_address)
VALUES (
  'YOUR_BORROWER_ID',
  'VESTA-12345',
  'Active',
  350000,
  'Conventional Mortgage',
  '123 Main St, Anytown, CA 12345'
);
```

### 3. Create Test Conditions

```sql
-- Borrower condition
INSERT INTO conditions (loan_id, title, description, status, responsible_party, due_date)
VALUES (
  'YOUR_LOAN_ID',
  'Proof of Income',
  'Please provide your most recent pay stubs and W-2 forms',
  'Open',
  'Borrower',
  CURRENT_DATE + INTERVAL '7 days'
);

-- Another borrower condition
INSERT INTO conditions (loan_id, title, description, status, responsible_party, due_date)
VALUES (
  'YOUR_LOAN_ID',
  'Bank Statements',
  'Please provide your last 2 months of bank statements',
  'Open',
  'Borrower',
  CURRENT_DATE + INTERVAL '7 days'
);

-- Lender condition (for reference)
INSERT INTO conditions (loan_id, title, description, status, responsible_party)
VALUES (
  'YOUR_LOAN_ID',
  'Property Appraisal',
  'Lender will order property appraisal',
  'Open',
  'Lender'
);
```

## Portal URLs

- `/login` - Borrower login page
- `/register` - New borrower registration
- `/forgot-password` - Password reset request
- `/dashboard` - Borrower dashboard (protected)
- `/loan/{loanId}` - Loan detail page (protected)
- `/loan/{loanId}/conditions` - Loan conditions with document upload (protected)

## Security Features

1. **JWT Authentication** - Secure JWT-based authentication via Supabase
2. **Password Hashing** - Passwords are automatically hashed by Supabase Auth
3. **Row Level Security (RLS)** - All database tables have RLS enabled
4. **Data Isolation** - Borrowers can only access their own data
5. **Protected Routes** - All portal pages require authentication
6. **Secure File Upload** - File validation and secure storage
7. **HTTPS Only** - All communication uses HTTPS

## File Upload Specifications

- **Maximum file size:** 25MB
- **Allowed file types:** PDF, PNG, JPEG
- **Storage location:** Supabase Storage bucket `loan-documents`
- **File naming:** `{loanId}/{timestamp}_{originalFilename}`

## Usage Flow

1. **Registration**
   - Borrower creates account at `/register`
   - Profile is created in `borrower_profiles` table
   - Email/password is stored in Supabase Auth

2. **Login**
   - Borrower logs in at `/login`
   - JWT token is issued
   - Redirected to dashboard

3. **Dashboard**
   - View all loans
   - See open conditions count
   - Quick access to loan details and conditions

4. **Loan Details**
   - View loan information
   - See uploaded documents
   - Navigate to conditions

5. **Conditions**
   - View all conditions (borrower and lender)
   - Upload documents for open borrower conditions
   - Track condition status (Open → Submitted → Cleared)

## Admin Tasks

Administrators should:
1. Create loan records for borrowers
2. Add conditions that need to be fulfilled
3. Review submitted documents
4. Update condition status from "Submitted" to "Cleared"
5. Monitor borrower activity

## Troubleshooting

### Cannot upload documents
- Verify the `loan-documents` storage bucket exists
- Check storage policies are correctly configured
- Ensure the borrower owns the loan
- Verify file size is under 25MB
- Check file type is PDF, PNG, or JPEG

### Cannot see loans/conditions
- Verify RLS policies are enabled and correct
- Check the borrower_id matches auth.uid()
- Ensure the borrower profile exists

### Login issues
- Verify email/password are correct
- Check Supabase Auth is properly configured
- Ensure email confirmation is disabled (or handle it)
