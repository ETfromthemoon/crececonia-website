begin;

do $$ begin
  if exists (select 1 from commerce.ebook_edition_notices) then
    raise exception 'Cannot remove edition notice history while rows exist';
  end if;
end $$;
drop table commerce.ebook_edition_notices;

commit;
