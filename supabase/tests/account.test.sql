-- Privacy and account tests (T6): data export scope and account deletion. Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

create or replace function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- Amy (a1) and Ben (b1) are active partners; Moddy (c1) is a moderator.
insert into public.invites (code) values ('ACCT-A'), ('ACCT-B'), ('ACCT-M');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'amy@test.dev', '{"invite_code":"ACCT-A"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'ben@test.dev', '{"invite_code":"ACCT-B"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'mod@test.dev', '{"invite_code":"ACCT-M"}');
update public.profiles set display_name = 'Amy', recovery_start_date = current_date - 5
  where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set display_name = 'Ben', recovery_start_date = current_date - 9
  where id = '00000000-0000-0000-0000-0000000000b1';
update public.profiles set display_name = 'Moddy', role = 'moderator'
  where id = '00000000-0000-0000-0000-0000000000c1';
insert into public.invites (code, created_by) values ('ACCT-BY-AMY', '00000000-0000-0000-0000-0000000000a1');

insert into public.check_ins (user_id, date, clean, mood, urge_level, note) values
  ('00000000-0000-0000-0000-0000000000a1', current_date, true, 4, 2, 'amy private note'),
  ('00000000-0000-0000-0000-0000000000a1', current_date - 1, false, 2, 8, 'amy hard day'),
  ('00000000-0000-0000-0000-0000000000b1', current_date, true, 3, 3, 'ben private note');
insert into public.partnerships (requester_id, partner_id, status) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', 'active');
insert into public.posts (id, author_id, body, removed_at, removed_by) values
  ('00000000-0000-0000-0000-0000000001a1', '00000000-0000-0000-0000-0000000000a1', 'amy post', null, null),
  ('00000000-0000-0000-0000-0000000002a1', '00000000-0000-0000-0000-0000000000a1', 'amy removed post', now(),
    '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-0000000000b1', 'ben post', null, null),
  ('00000000-0000-0000-0000-0000000002b1', '00000000-0000-0000-0000-0000000000b1', 'ben removed post', now(),
    '00000000-0000-0000-0000-0000000000c1');
insert into public.comments (post_id, author_id, body) values
  ('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-0000000000a1', 'amy on ben'),
  ('00000000-0000-0000-0000-0000000001a1', '00000000-0000-0000-0000-0000000000b1', 'ben on amy'),
  ('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-0000000000b1', 'ben on ben');
insert into public.reactions (post_id, user_id, kind) values
  ('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-0000000000a1', 'support');
insert into public.reports (post_id, reporter_id, reason) values
  ('00000000-0000-0000-0000-0000000001b1', '00000000-0000-0000-0000-0000000000a1', 'amy report');

select hasnt_column('public', 'profiles', 'email', 'profiles never store email addresses');

-- Export: Amy's queries (filtered by user, as the export route does) return only her own data.
select pg_temp.login_as('00000000-0000-0000-0000-0000000000a1');
select is((select count(*)::int from public.check_ins), 2, 'export: a member reads all of their own check-ins');
select is(
  (select array_agg(note order by date) from public.check_ins),
  array['amy hard day', 'amy private note'],
  'export: a member gets their own private notes'
);
select is((select count(*)::int from public.check_ins where user_id = '00000000-0000-0000-0000-0000000000b1'), 0,
  'export: a member cannot read their partner''s check-ins or notes directly');
select is((select count(*)::int from public.posts where author_id = auth.uid()), 2,
  'export: a member gets their own posts, including removed ones');
select is((select count(*)::int from public.posts where body = 'ben removed post'), 0,
  'a member cannot read another member''s removed post');
select is((select count(*)::int from public.comments where author_id = auth.uid()), 1,
  'export: a member gets their own comments');
select throws_ok($$ select email from auth.users $$, '42501', null, 'members cannot read login emails');
select throws_ok(
  $$ insert into public.check_ins (user_id, date, clean, mood, urge_level) values
     ('00000000-0000-0000-0000-0000000000b1', current_date - 3, true, 3, 3) $$,
  '42501', null, 'members cannot write check-ins for someone else'
);
update public.check_ins set note = 'tampered' where user_id = '00000000-0000-0000-0000-0000000000b1';
delete from public.check_ins where user_id = '00000000-0000-0000-0000-0000000000b1';
delete from public.posts where author_id = '00000000-0000-0000-0000-0000000000b1';

-- Moderators cannot read anyone's check-ins either.
select pg_temp.login_as('00000000-0000-0000-0000-0000000000c1');
select is((select count(*)::int from public.check_ins), 0, 'moderators cannot read members'' check-ins');

select pg_temp.logout();
select is((select note from public.check_ins where user_id = '00000000-0000-0000-0000-0000000000b1'),
  'ben private note', 'members cannot change or delete another member''s check-in');
select is((select count(*)::int from public.posts where author_id = '00000000-0000-0000-0000-0000000000b1'), 2,
  'members cannot delete another member''s posts');

-- Deletion can only ever target the caller.
set local role anon;
select throws_ok($$ select public.delete_my_account() $$, '42501', null, 'logged-out visitors cannot call delete_my_account');
select pg_temp.logout();
select set_config('role', 'authenticated', true), set_config('request.jwt.claims', '{"role":"authenticated"}', true);
select throws_ok($$ select public.delete_my_account() $$, 'P0001', 'Not signed in', 'delete_my_account needs a signed-in member');

select pg_temp.login_as('00000000-0000-0000-0000-0000000000a1');
select lives_ok($$ select public.delete_my_account() $$, 'a member can delete their own account');

select pg_temp.logout();
select is((select count(*)::int from auth.users where id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'deletion removes the login and email');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'deletion removes the profile');
select is((select count(*)::int from public.check_ins where user_id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'deletion removes all check-ins and notes');
select is((select count(*)::int from public.posts where author_id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'deletion removes all posts');
select is((select count(*)::int from public.comments where author_id = '00000000-0000-0000-0000-0000000000a1'
  or body = 'ben on amy'), 0, 'deletion removes the member''s comments and comments on their posts');
select is((select count(*)::int from public.reactions where user_id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'deletion removes reactions');
select is((select count(*)::int from public.partnerships), 0, 'deletion removes partnerships');
select is((select count(*)::int from public.reports where reporter_id = '00000000-0000-0000-0000-0000000000a1'), 0,
  'deletion removes reports the member made');
select is((select count(*)::int from public.invites where created_by = '00000000-0000-0000-0000-0000000000a1'
  or used_by = '00000000-0000-0000-0000-0000000000a1'), 0, 'invites no longer point at the deleted member');

select is((select count(*)::int from public.profiles where id in
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000c1')), 2,
  'other members are untouched');
select is((select count(*)::int from public.check_ins where user_id = '00000000-0000-0000-0000-0000000000b1'), 1,
  'other members keep their check-ins');
select is((select count(*)::int from public.comments where body = 'ben on ben'), 1,
  'other members keep their own comments');

select * from finish();
rollback;
