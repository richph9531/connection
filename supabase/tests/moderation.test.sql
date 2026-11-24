-- Moderation, invites and admin roles (F5). Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(32);

create or replace function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- m1 = member (author), m2 = member (reporter), mod = moderator, adm = admin
insert into public.invites (code) values ('T5-MEM1'), ('T5-MEM2'), ('T5-MOD'), ('T5-ADM');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000005a1', 'm1@t5.dev', '{"invite_code":"T5-MEM1"}'),
  ('00000000-0000-0000-0000-0000000005a2', 'm2@t5.dev', '{"invite_code":"T5-MEM2"}'),
  ('00000000-0000-0000-0000-0000000005c0', 'mod@t5.dev', '{"invite_code":"T5-MOD"}'),
  ('00000000-0000-0000-0000-0000000005ad', 'adm@t5.dev', '{"invite_code":"T5-ADM"}');
update public.profiles set display_name = 'T5 Author' where id = '00000000-0000-0000-0000-0000000005a1';
update public.profiles set display_name = 'T5 Reporter' where id = '00000000-0000-0000-0000-0000000005a2';
update public.profiles set display_name = 'T5 Mod', role = 'moderator' where id = '00000000-0000-0000-0000-0000000005c0';
update public.profiles set display_name = 'T5 Admin', role = 'admin' where id = '00000000-0000-0000-0000-0000000005ad';

insert into public.posts (id, author_id, body) values
  ('00000000-0000-0000-0000-0000000005f1', '00000000-0000-0000-0000-0000000005a1', 'T5 post');
insert into public.comments (id, post_id, author_id, body) values
  ('00000000-0000-0000-0000-0000000005e1', '00000000-0000-0000-0000-0000000005f1', '00000000-0000-0000-0000-0000000005a1', 'T5 comment');
insert into public.check_ins (user_id, date, clean, mood, urge_level, note) values
  ('00000000-0000-0000-0000-0000000005a1', current_date, true, 3, 4, 't5 private note');

-- Reporter (a regular member) --------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000005a2');
select lives_ok(
  $$ insert into public.reports (post_id, reporter_id, reason) values ('00000000-0000-0000-0000-0000000005f1', auth.uid(), 'post reason') $$,
  'members can report a post'
);
select lives_ok(
  $$ insert into public.reports (comment_id, reporter_id, reason) values ('00000000-0000-0000-0000-0000000005e1', auth.uid(), 'comment reason') $$,
  'members can report a comment'
);
select throws_ok(
  $$ insert into public.reports (post_id, reporter_id, reason) values ('00000000-0000-0000-0000-0000000005f1', '00000000-0000-0000-0000-0000000005a1', 'spoof') $$,
  '42501', null, 'members cannot report in someone else''s name'
);
select throws_ok(
  $$ insert into public.reports (post_id, reporter_id, reason, status) values ('00000000-0000-0000-0000-0000000005f1', auth.uid(), 'x', 'dismissed') $$,
  '42501', null, 'members cannot file an already-closed report'
);
select is((select count(*)::int from public.reports), 0, 'members cannot read reports, not even their own');
update public.reports set status = 'dismissed';
select throws_ok($$ select public.set_post_removed('00000000-0000-0000-0000-0000000005f1', true) $$, 'P0001', null, 'members cannot remove posts');
select throws_ok($$ select public.set_comment_removed('00000000-0000-0000-0000-0000000005e1', true) $$, 'P0001', null, 'members cannot remove comments');
select throws_ok(
  $$ insert into public.invites (code, created_by) values ('T5-MEMBER-MADE', auth.uid()) $$,
  '42501', null, 'members cannot create invites'
);
select is((select count(*)::int from public.invites), 0, 'members cannot read invites');
delete from public.invites where code = 'T5-UNUSED';
select throws_ok($$ select public.set_member_role(auth.uid(), 'moderator') $$, 'P0001', null, 'members cannot change roles');
select is(
  (select array_agg(column_name::text order by column_name) from information_schema.columns
   where table_schema = 'public' and table_name = 'member_directory'),
  array['display_name', 'id', 'role'],
  'the member directory exposes display names and roles only'
);

select pg_temp.logout();
select is((select count(*)::int from public.reports where status = 'open' and reason in ('post reason', 'comment reason')), 2,
  'member updates leave reports open');

-- Moderator --------------------------------------------------------------------
insert into public.invites (code) values ('T5-UNUSED');
select pg_temp.login_as('00000000-0000-0000-0000-0000000005c0');
select is((select count(*)::int from public.reports where reason in ('post reason', 'comment reason')), 2, 'moderators read open reports');
select is((select count(*)::int from public.check_ins), 0, 'moderators cannot read members'' check-ins');
select lives_ok(
  $$ insert into public.invites (code, created_by, expires_at) values ('T5-NEW-INVITE', auth.uid(), now() + interval '7 days') $$,
  'moderators create invites'
);
select throws_ok(
  $$ insert into public.invites (code, created_by) values ('T5-SPOOF-INVITE', '00000000-0000-0000-0000-0000000005ad') $$,
  '42501', null, 'moderators cannot create invites in someone else''s name'
);
select throws_ok(
  $$ insert into public.invites (code, created_by, used_at) values ('T5-PREUSED', auth.uid(), now()) $$,
  '42501', null, 'moderators cannot create already-used invites'
);
select is(public.check_invite('T5-NEW-INVITE'), true, 'a new invite can be used to join');
delete from public.invites where code = 'T5-MEM1';
select is((select count(*)::int from public.invites where code = 'T5-MEM1'), 1, 'used invites cannot be deleted');
delete from public.invites where code = 'T5-UNUSED';
select is((select count(*)::int from public.invites where code = 'T5-UNUSED'), 0, 'unused invites can be withdrawn');
update public.invites set expires_at = now() + interval '1 year' where code = 'T5-NEW-INVITE';
select ok((select expires_at < now() + interval '8 days' from public.invites where code = 'T5-NEW-INVITE'),
  'invites cannot be extended after they are created');

select lives_ok($$ select public.set_comment_removed('00000000-0000-0000-0000-0000000005e1', true) $$, 'moderators remove comments');
select is((select removed_by from public.comments where id = '00000000-0000-0000-0000-0000000005e1'),
  '00000000-0000-0000-0000-0000000005c0'::uuid, 'removals record the moderator');
update public.reports set status = 'resolved' where comment_id = '00000000-0000-0000-0000-0000000005e1';
update public.reports set status = 'dismissed' where post_id = '00000000-0000-0000-0000-0000000005f1';
select is((select count(*)::int from public.reports where status = 'open' and reason in ('post reason', 'comment reason')), 0,
  'moderators resolve and dismiss reports');
select throws_ok($$ select public.set_member_role('00000000-0000-0000-0000-0000000005a1', 'moderator') $$, 'P0001', null, 'moderators cannot change roles');

-- Other members no longer see the removed comment; its author still does.
select pg_temp.login_as('00000000-0000-0000-0000-0000000005a2');
select is((select count(*)::int from public.comments where id = '00000000-0000-0000-0000-0000000005e1'), 0, 'removed comments are hidden from other members');
select pg_temp.login_as('00000000-0000-0000-0000-0000000005a1');
select is((select count(*)::int from public.comments where id = '00000000-0000-0000-0000-0000000005e1'), 1, 'authors still see their own removed comment');

select pg_temp.login_as('00000000-0000-0000-0000-0000000005c0');
select public.set_comment_removed('00000000-0000-0000-0000-0000000005e1', false);
select pg_temp.login_as('00000000-0000-0000-0000-0000000005a2');
select is((select count(*)::int from public.comments where id = '00000000-0000-0000-0000-0000000005e1'), 1, 'restored comments are visible again');

-- Admin ------------------------------------------------------------------------
select pg_temp.login_as('00000000-0000-0000-0000-0000000005ad');
select lives_ok($$ select public.set_member_role('00000000-0000-0000-0000-0000000005a1', 'moderator') $$, 'admins change roles');
select is((select role from public.member_directory where id = '00000000-0000-0000-0000-0000000005a1'), 'moderator'::public.member_role, 'the new role is saved');
select public.set_member_role('00000000-0000-0000-0000-0000000005c0', 'member');

-- A demoted moderator loses access straight away.
select pg_temp.login_as('00000000-0000-0000-0000-0000000005c0');
select is((select count(*)::int from public.reports), 0, 'demoted moderators can no longer read reports');
select is((select count(*)::int from public.invites), 0, 'demoted moderators can no longer read invites');

select * from finish();
rollback;
