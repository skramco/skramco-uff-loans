# Borrower Portal System

A secure, full-featured borrower authentication and portal system for managing loan applications, conditions, and document uploads.

## Features

### Authentication
- ✅ Secure JWT-based authentication via Supabase Auth
- ✅ Email + password login
- ✅ New user registration
- ✅ Password reset functionality
- ✅ Automatic password hashing (bcrypt via Supabase)
- ✅ Protected routes with authentication guards

### Borrower Dashboard
- ✅ View all loans at a glance
- ✅ See loan status and details
- ✅ Track open conditions requiring attention
- ✅ Quick navigation to loan details and conditions

### Loan Management
- ✅ View detailed loan information
- ✅ See loan amount, property address, and status
- ✅ Access loan documents
- ✅ Navigate to conditions

### Conditions Tracking
- ✅ View all conditions for a loan
- ✅ Separate display for borrower and lender conditions
- ✅ Status tracking (Open, Submitted, Cleared)
- ✅ Due date tracking
- ✅ Upload documents for specific conditions
- ✅ View uploaded documents

### Document Upload
- ✅ Secure file upload to Supabase Storage
- ✅ Support for PDF, PNG, JPEG files
- ✅ Max file size: 25MB
- ✅ File validation (type and size)
- ✅ Automatic condition status update on upload
- ✅ Document association with conditions

### Security
- ✅ Row Level Security (RLS) on all tables
- ✅ Data isolation - borrowers only see their own data
- ✅ Server-side validation
- ✅ ID enumeration prevention
- ✅ Secure file storage with access controls
- ✅ JWT token-based authentication

## Architecture

### Frontend Pages

**Public Pages:**
- `/login` - Login page with email/password form
- `/register` - Registration page for new borrowers
- `/forgot-password` - Password reset request page

**Protected Pages (require authentication):**
- `/dashboard` - Borrower dashboard showing all loans and conditions
- `/loan/{loanId}` - Detailed view of a specific loan
- `/loan/{loanId}/conditions` - Conditions list with document upload

### Database Schema

**Tables:**
- `borrower_profiles` - Extends auth.users with additional borrower info
- `loans` - Stores loan applications
- `conditions` - Tracks loan conditions that need to be fulfilled
- `documents` - Stores metadata for uploaded documents

**Storage:**
- `loan-documents` bucket - Stores actual document files

### Technology Stack

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage
- **Build Tool:** Vite

## Setup Instructions

### 1. Database Migration

The database tables have already been created via migration:
- `supabase/migrations/create_borrower_portal_schema.sql`

### 2. Storage Bucket Setup

**Manual Setup (Required):**

1. Go to your Supabase Dashboard → Storage
2. Click "Create a new bucket"
3. Configure:
   - **Name:** `loan-documents`
   - **Public:** No (keep private)
   - **File size limit:** 26214400 bytes (25MB)
   - **Allowed MIME types:**
     - `application/pdf`
     - `image/png`
     - `image/jpeg`
     - `image/jpg`

4. Run the SQL script to set up storage policies:
   - Open `STORAGE_SETUP.sql`
   - Copy the contents
   - Run in Supabase SQL Editor

### 3. Test Data Setup

To test the portal, create test data:

**Option 1: Use the UI**
1. Go to `/register`
2. Create a new account
3. Use the Supabase Dashboard to add loans and conditions

**Option 2: SQL Script**
```sql
-- 1. Register a user via the UI first, then get their ID

-- 2. Create a loan for the user
INSERT INTO loans (borrower_id, status, loan_amount, loan_type, property_address)
VALUES (
  'BORROWER_USER_ID',
  'Active',
  350000,
  'Conventional Mortgage',
  '123 Main St, Anytown, CA 12345'
);

-- 3. Create conditions
INSERT INTO conditions (loan_id, title, description, status, responsible_party, due_date)
VALUES
  ('LOAN_ID', 'Proof of Income', 'Please provide pay stubs and W-2', 'Open', 'Borrower', CURRENT_DATE + 7),
  ('LOAN_ID', 'Bank Statements', 'Last 2 months of statements', 'Open', 'Borrower', CURRENT_DATE + 7);
```

## Usage Guide

### For Borrowers

1. **Registration**
   - Visit `/register`
   - Enter first name, last name, email, and password
   - Submit to create account
   - Automatically logged in and redirected to dashboard

2. **Login**
   - Visit `/login` or click "Borrower Login" in navigation
   - Enter email and password
   - Redirected to dashboard on success

3. **Dashboard**
   - View all your loans
   - See status of each loan
   - View count of open conditions
   - Click "View Details" to see loan information
   - Click "Conditions" to manage conditions

4. **Loan Details**
   - View comprehensive loan information
   - See all uploaded documents
   - Navigate to conditions page

5. **Managing Conditions**
   - View all conditions for the loan
   - Conditions marked "Your Action Required" need your attention
   - Click "Upload Document" on open conditions
   - Select a file (PDF, PNG, or JPEG, max 25MB)
   - Document is uploaded and condition status changes to "Submitted"
   - Lender will review and update status to "Cleared"

6. **Password Reset**
   - Click "Forgot password?" on login page
   - Enter your email address
   - Check email for reset link
   - Follow link to set new password

### For Administrators

1. **Creating Loans**
   - Use Supabase Dashboard or admin interface
   - Insert loan record with borrower_id from borrower_profiles

2. **Adding Conditions**
   - Create condition records linked to loans
   - Set responsible_party to "Borrower" for borrower tasks
   - Set due_date for time-sensitive conditions

3. **Reviewing Documents**
   - Access Supabase Storage → loan-documents bucket
   - Review uploaded documents
   - Update condition status to "Cleared" when satisfied

4. **Managing Status**
   - Update loan status as application progresses
   - Clear conditions as they're satisfied
   - Add new conditions as needed

## API / Database Operations

### Creating a Borrower Profile

Done automatically on registration, but can be done manually:

```typescript
const { data, error } = await supabase
  .from('borrower_profiles')
  .insert({
    id: userId, // from auth.users
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com'
  });
```

### Creating a Loan

```typescript
const { data, error } = await supabase
  .from('loans')
  .insert({
    borrower_id: borrowerId,
    status: 'Active',
    loan_amount: 350000,
    loan_type: 'Conventional Mortgage',
    property_address: '123 Main St'
  });
```

### Creating Conditions

```typescript
const { data, error } = await supabase
  .from('conditions')
  .insert({
    loan_id: loanId,
    title: 'Proof of Income',
    description: 'Please provide pay stubs',
    status: 'Open',
    responsible_party: 'Borrower',
    due_date: '2024-01-15'
  });
```

### Uploading Documents

```typescript
// Upload to storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('loan-documents')
  .upload(`${loanId}/${fileName}`, file);

// Create document record
const { data, error } = await supabase
  .from('documents')
  .insert({
    loan_id: loanId,
    condition_id: conditionId,
    file_name: file.name,
    file_url: publicUrl,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: userId
  });
```

## Security Considerations

### Row Level Security Policies

All tables have RLS enabled with restrictive policies:

**borrower_profiles:**
- Users can view/update only their own profile
- Users can insert their own profile on registration

**loans:**
- Borrowers can only view/update loans where borrower_id = auth.uid()

**conditions:**
- Borrowers can only view/update conditions for their own loans

**documents:**
- Borrowers can only view/upload/delete documents for their own loans

**storage.objects:**
- Borrowers can only upload to folders matching their loan IDs
- Borrowers can only view/delete files in their loan folders

### Authentication Guards

All protected routes use the `ProtectedRoute` wrapper component that:
- Checks if user is authenticated
- Shows loading state while checking
- Redirects to login if not authenticated
- Only renders content if authenticated

### Data Validation

- File type validation (PDF, PNG, JPEG only)
- File size validation (25MB max)
- Form input validation
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping

## File Structure

```
src/
├── components/
│   ├── LoginPage.tsx                 # Login page
│   ├── RegisterPage.tsx              # Registration page
│   ├── ForgotPasswordPage.tsx        # Password reset
│   ├── BorrowerDashboard.tsx         # Main dashboard
│   ├── LoanDetailPage.tsx            # Loan details
│   ├── LoanConditionsPage.tsx        # Conditions + upload
│   └── ProtectedRoute.tsx            # Auth guard wrapper
├── contexts/
│   └── AuthContext.tsx               # Auth state management
├── types/
│   └── index.ts                      # TypeScript types
└── lib/
    └── supabase.ts                   # Supabase client

supabase/
└── migrations/
    └── create_borrower_portal_schema.sql   # Database schema
```

## Troubleshooting

### Cannot login
- Verify email/password are correct
- Check user exists in Supabase Auth
- Ensure borrower_profiles record exists for the user

### Cannot see loans
- Verify loans exist in database with correct borrower_id
- Check RLS policies are enabled
- Confirm user is authenticated

### Cannot upload documents
- Ensure loan-documents bucket exists
- Verify storage policies are configured
- Check file is under 25MB
- Ensure file type is PDF, PNG, or JPEG
- Confirm user owns the loan

### Storage bucket not found
- Create the bucket manually in Supabase Dashboard
- Run STORAGE_SETUP.sql to configure policies
- Ensure bucket name is exactly "loan-documents"

## Next Steps

Potential enhancements:
- Email notifications when documents are uploaded
- Document preview/viewer
- Bulk document upload
- Document comments/feedback from lender
- Activity timeline
- Mobile app version
- Multi-factor authentication
- Document templates
- E-signature integration
- Real-time status updates
