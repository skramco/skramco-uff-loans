-- Vesta-assigned borrower-facing loan number (integer in API, stored as text).
ALTER TABLE public.loans
  ADD COLUMN IF NOT EXISTS vesta_loan_number text;

COMMENT ON COLUMN public.loans.vesta_loan_number IS
  'Vesta loanNumber from POST /loans; distinct from vesta_loan_id (GUID).';

CREATE INDEX IF NOT EXISTS idx_loans_vesta_loan_number
  ON public.loans (vesta_loan_number)
  WHERE vesta_loan_number IS NOT NULL;
