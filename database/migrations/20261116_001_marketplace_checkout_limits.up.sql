begin;

-- One atomic counter per hashed buyer/book or client IP. The fixed window
-- resets in place, so this table does not retain an unbounded request log.
create table public.marketplace_checkout_limits (
  key_hash char(64) primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  attempts integer not null check (attempts > 0),
  updated_at timestamptz not null default now()
);

commit;
