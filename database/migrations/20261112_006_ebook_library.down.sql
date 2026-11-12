drop function if exists commerce.revoke_ebook_library_session(text);
drop function if exists commerce.consume_ebook_library_challenge(text,text);
drop function if exists commerce.reserve_ebook_library_request(text,text);
drop table if exists commerce.ebook_library_rate_limits;
drop table if exists commerce.ebook_library_sessions;
drop table if exists commerce.ebook_library_challenges;
