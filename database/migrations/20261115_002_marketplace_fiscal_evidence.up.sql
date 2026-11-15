begin;

-- A paid marketplace order has at most one original fiscal document. The
-- merchant's actual SII emission model determines whether that is a voucher
-- or a boleta; this table records evidence and does not emit either document.
create table public.marketplace_fiscal_evidence (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.marketplace_orders(id) on delete restrict,
  issuer_code text not null default 'crececonia' check (issuer_code = 'crececonia'),
  document_kind text not null check (document_kind in ('voucher', 'boleta')),
  document_reference text not null check (char_length(document_reference) between 3 and 120),
  issued_at timestamptz not null,
  status text not null default 'recorded' check (status = 'recorded'),
  recorded_by text not null check (char_length(recorded_by) between 1 and 120),
  recorded_at timestamptz not null default now(),
  unique (issuer_code, document_kind, document_reference)
);

create index marketplace_fiscal_evidence_recorded_idx
  on public.marketplace_fiscal_evidence(recorded_at desc);

create trigger marketplace_fiscal_evidence_immutable
before update or delete on public.marketplace_fiscal_evidence
for each row execute function public.marketplace_reject_immutable_mutation();

commit;
