-- Campaign hero images must be publicly readable (email clients + admin preview).
UPDATE storage.buckets
SET public = true
WHERE id = 'marketing-assets';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Marketing assets public read'
  ) THEN
    CREATE POLICY "Marketing assets public read"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'marketing-assets');
  END IF;
END $$;
