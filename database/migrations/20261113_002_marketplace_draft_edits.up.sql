begin;

-- Every seller edit creates a new immutable revision. Files and tax approval
-- belong to a revision and must be submitted again after an edit.
create function public.marketplace_edit_book_draft(
  p_owner_user_id text, p_book_id uuid, p_title text, p_description text,
  p_category text, p_price_minor bigint
) returns uuid language plpgsql as $$
declare
  v_author_name text;
  v_revision_number integer;
  v_revision_id uuid;
begin
  select s.display_name into v_author_name
  from public.marketplace_books b
  join public.marketplace_sellers s on s.id = b.seller_id
  where b.id = p_book_id and s.owner_user_id = p_owner_user_id
    and ((b.status = 'draft' and s.status in ('draft', 'pending_verification', 'active'))
      or (b.status = 'changes_requested' and s.status in ('pending_verification', 'active')))
  for update of b;
  if v_author_name is null then return null; end if;

  select coalesce(max(revision_number), 0) + 1 into v_revision_number
  from public.marketplace_book_revisions where book_id = p_book_id;
  insert into public.marketplace_book_revisions
    (book_id, revision_number, title, description, author_display_name, category,
     price_minor, rights_declaration_version, rights_declared_at)
  values
    (p_book_id, v_revision_number, p_title, p_description, v_author_name, p_category,
     p_price_minor, 'marketplace-rights-v1', now()) returning id into v_revision_id;
  update public.marketplace_books
  set current_revision_id = v_revision_id, status = 'draft', updated_at = now()
  where id = p_book_id;
  insert into public.marketplace_audit_log (actor_user_id, action, entity_type, entity_id)
  values (p_owner_user_id, 'book_draft_edited', 'book', p_book_id);
  return v_revision_id;
end;
$$;

commit;
