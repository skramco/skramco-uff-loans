-- Storage Bucket Setup for Borrower Portal
-- Run this script in your Supabase SQL Editor after creating the bucket manually

-- Note: The bucket must be created manually in the Supabase Dashboard first:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "Create a new bucket"
-- 3. Name: loan-documents
-- 4. Public: NO (keep it private)
-- 5. File size limit: 26214400 (25MB)
-- 6. Allowed MIME types: application/pdf, image/png, image/jpeg, image/jpg

-- Enable RLS on storage.objects (usually already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Borrowers can upload documents to own loans" ON storage.objects;
DROP POLICY IF EXISTS "Borrowers can view own loan documents" ON storage.objects;
DROP POLICY IF EXISTS "Borrowers can delete own uploaded documents" ON storage.objects;

-- Policy: Borrowers can upload documents to their own loan folders
CREATE POLICY "Borrowers can upload documents to own loans"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'loan-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM loans WHERE borrower_id = auth.uid()
    )
  );

-- Policy: Borrowers can view documents from their own loan folders
CREATE POLICY "Borrowers can view own loan documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'loan-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM loans WHERE borrower_id = auth.uid()
    )
  );

-- Policy: Borrowers can delete their own uploaded documents
CREATE POLICY "Borrowers can delete own uploaded documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'loan-documents'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM loans WHERE borrower_id = auth.uid()
    )
  );
