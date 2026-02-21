const API_URL = 'https://api.supabase.com/v1/projects/pvzqgboffydqeqzeiysx/database/query';
const TOKEN = 'sbp_dd808634e6e587f6e7a85e628f9e38f8abd88c34';

async function execSQL(label, query) {
  console.log(`\n--- ${label} ---`);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`  ERROR (${res.status}):`, text);
    return false;
  }
  console.log('  OK');
  return true;
}

async function run() {
  // 1. Add temp_loan_number column
  await execSQL('Add temp_loan_number column', `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'loans' AND column_name = 'temp_loan_number'
      ) THEN
        ALTER TABLE loans ADD COLUMN temp_loan_number text;
      END IF;
    END $$;
  `);

  // 2. Add phone column to borrower_profiles
  await execSQL('Add phone column', `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'borrower_profiles' AND column_name = 'phone'
      ) THEN
        ALTER TABLE borrower_profiles ADD COLUMN phone text;
      END IF;
    END $$;
  `);

  // 3. Create temp loan number generator function
  await execSQL('Create generate_temp_loan_number function', `
    CREATE OR REPLACE FUNCTION generate_temp_loan_number()
    RETURNS TRIGGER AS $$
    DECLARE
      seq_num integer;
    BEGIN
      SELECT COALESCE(MAX(CAST(SUBSTRING(temp_loan_number FROM 10) AS integer)), 10000) + 1
      INTO seq_num
      FROM loans
      WHERE temp_loan_number IS NOT NULL AND temp_loan_number LIKE 'UFF-TEMP-%';

      NEW.temp_loan_number := 'UFF-TEMP-' || seq_num;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = '';
  `);

  // 4. Create trigger
  await execSQL('Create trigger', `
    DROP TRIGGER IF EXISTS generate_temp_loan_number_trigger ON public.loans;
    CREATE TRIGGER generate_temp_loan_number_trigger
      BEFORE INSERT ON public.loans
      FOR EACH ROW
      WHEN (NEW.temp_loan_number IS NULL)
      EXECUTE FUNCTION generate_temp_loan_number();
  `);

  // 5. Create unique index
  await execSQL('Create unique index', `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_loans_temp_loan_number
      ON loans(temp_loan_number) WHERE temp_loan_number IS NOT NULL;
  `);

  // 6. Add INSERT policy for loans
  await execSQL('Add INSERT policy for loans', `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'loans' AND policyname = 'Borrowers can create own loans'
      ) THEN
        CREATE POLICY "Borrowers can create own loans"
          ON loans FOR INSERT
          TO authenticated
          WITH CHECK (borrower_id = auth.uid());
      END IF;
    END $$;
  `);

  console.log('\n=== Migration complete ===');
}

run().catch(console.error);
