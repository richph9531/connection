-- Timestamp integrity and report retention. Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

create or replace function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- a1 = author, a2 = reporter, mod = moderator
insert into public.invites (code) values ('SEC-A1'), ('SEC-A2'), ('SEC-MOD');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000e0a1', 'a1@sec.dev', '{"invite_code":"SEC-A1"}'),
  ('00000000-0000-0000-0000-00000000e0a2', 'a2@sec.dev', '{"invite_code":"SEC-A2"}'),
  ('00000000-0000-0000-0000-00000000e0c0', 'mod@sec.dev', '{"invite_code":"SEC-MOD"}');
update public.profiles set display_name = 'Sec Author' where id = '00000000-0000-0000-0000-00000000e0a1';
update public.profiles set display_name = 'Sec Reporter' where id = '00000000-0000-0000-0000-00000000e0a2';
update public.profiles set display_name = 'Sec Mod', role = 'moderator' where id = '00000000-0000-0000-0000-00000000e0c0';

-- Timestamps -----------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-00000000e0a1');
insert into public.posts (id, author_id, body, created_at) values
  ('00000000-0000-0000-0000-00000000e0f1', auth.uid(), 'future post', now() + interval '1 year');
insert into public.comments (id, post_id, author_id, body, created_at) values
  ('00000000-0000-0000-0000-00000000e0e1', '00000000-0000-0000-0000-00000000e0f1', auth.uid(), 'old comment', '2000-01-01');
select is((select created_at from public.posts where id = '00000000-0000-0000-0000-00000000e0f1'), now(),
  'members cannot choose a post''s timestamp');
select is((select created_at from public.comments where id = '00000000-0000-0000-0000-00000000e0e1'), now(),
  'members cannot choose a comment''s timestamp');

select pg_temp.login_as('00000000-0000-0000-0000-00000000e0a2');
insert into public.reactions (post_id, user_id, kind, created_at) values
  ('00000000-0000-0000-0000-00000000e0f1', auth.uid(), 'support', '2000-01-01');
select is((select created_at from public.reactions where user_id = auth.uid()), now(),
  'members cannot choose a reaction''s timestamp');

-- Reports --------------------------------------------------------------------
insert into public.reports (post_id, reporter_id, reason, reported_author_id, created_at) values
  ('00000000-0000-0000-0000-00000000e0f1', auth.uid(), 'post reason', auth.uid(), '2000-01-01');
insert into public.reports (comment_id, reporter_id, reason) values
  ('00000000-0000-0000-0000-00000000e0e1', auth.uid(), 'comment reason');
select throws_ok(
  $$ insert into public.reports (post_id, reporter_id, reason) values ('00000000-0000-0000-0000-00000000dead', auth.uid(), 'x') $$,
  '23503', null, 'content that does not exist cannot be reported'
);

-- Author deletes the reported post (which also deletes the reported comment).
select pg_temp.login_as('00000000-0000-0000-0000-00000000e0a1');
delete from public.posts where id = '00000000-0000-0000-0000-00000000e0f1';
select is((select count(*)::int from public.reports), 0, 'authors still cannot see reports about their content');
select throws_ok(
  $$ insert into public.posts (id, author_id, body) values ('00000000-0000-0000-0000-00000000e0f1', auth.uid(), 'swapped') $$,
  '23505', null, 'a reported post''s id cannot be reused'
);
insert into public.posts (id, author_id, body) values ('00000000-0000-0000-0000-00000000e0f2', auth.uid(), 'new post');
select throws_ok(
  $$ insert into public.comments (id, post_id, author_id, body) values
     ('00000000-0000-0000-0000-00000000e0e1', '00000000-0000-0000-0000-00000000e0f2', auth.uid(), 'swapped') $$,
  '23505', null, 'a reported comment''s id cannot be reused'
);

select pg_temp.login_as('00000000-0000-0000-0000-00000000e0c0');
select is((select count(*)::int from public.reports where status = 'open'), 2,
  'reports stay open after the author deletes the content');
select is(
  (select array_agg(distinct reported_author_id) from public.reports),
  array['00000000-0000-0000-0000-00000000e0a1'::uuid],
  'reports record the real author, not what the reporter claimed'
);
select is((select created_at from public.reports where reason = 'post reason'), now(),
  'members cannot choose a report''s timestamp');
select lives_ok($$ update public.reports set status = 'resolved' $$, 'moderators can close reports about deleted content');

-- Author deletes their account: reports about them go too.
select pg_temp.logout();
delete from auth.users where id = '00000000-0000-0000-0000-00000000e0a1';
select is((select count(*)::int from public.reports), 0, 'deleting an account removes reports about that member');

select * from finish();
rollback;
