-- Table: profiles
create table public.profiles (
  id uuid not null,
  email text null,
  role text null default 'free'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  sisa_quota integer null default 5,
  tipe_premium public.premium_type null,
  tanggal_upgrade_premium timestamp with time zone null,
  sisa_waktu_premium integer null,
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger trigger_set_quota BEFORE INSERT
or
update OF role on profiles for EACH row
execute FUNCTION set_quota_based_on_role ();


-- Table: payment_intents
CREATE TABLE public.payment_intents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL DEFAULT auth.uid(),
    plan_type text NOT NULL CHECK (plan_type IN ('weekly', 'monthly')),
    expected_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'waiting_payment' CHECK (status IN ('waiting_payment', 'waiting_verification', 'active', 'expired')),
    created_at timestamp with time zone DEFAULT now()
);

-- Table: payment_proofs
CREATE TABLE public.payment_proofs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_intent_id uuid REFERENCES public.payment_intents(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    paid_amount numeric,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Policies for payment_intents
CREATE POLICY "Users can create their own payment intents"
    ON public.payment_intents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment intents"
    ON public.payment_intents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment intents"
    ON public.payment_intents FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies for payment_proofs
-- Logic: A user can insert a proof if they own the related payment_intent
CREATE POLICY "Users can insert proof for their own intents"
    ON public.payment_proofs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.payment_intents
            WHERE id = payment_intent_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own proofs"
    ON public.payment_proofs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.payment_intents
            WHERE id = payment_intent_id AND user_id = auth.uid()
        )
    );

-- Storage Policies for 'payment_proofs' bucket
-- Note: Replace 'payment_proofs' with your actual bucket name if different.
CREATE POLICY "Users can upload payment proofs"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'payment_proofs' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Anyone can view proofs via public url"
    ON storage.objects FOR SELECT
    
-- Table: api_key_limits
CREATE TABLE public.api_key_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,              -- e.g., 'cerebras'
  model text NOT NULL,                 -- e.g., 'llama3.1-8b'
  key_name text NOT NULL,              -- e.g., 'CEREBRAS_KEY_1'
  limit_type text NOT NULL,            -- rpm | rph | rpd | tpm | tph | tpd
  remaining integer NOT NULL,
  reset_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'ok',    -- ok | limited
  last_seen_at timestamp with time zone DEFAULT now(),
  UNIQUE (provider, model, key_name, limit_type)
);

-- Enable RLS for api_key_limits
ALTER TABLE public.api_key_limits ENABLE ROW LEVEL SECURITY;

-- Policy for Admins to manage limits
CREATE POLICY "Admins can manage api_key_limits"
    ON public.api_key_limits FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
