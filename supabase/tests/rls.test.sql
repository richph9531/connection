-- Row level security tests. Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

-- Helpers to act as a given user.
create or replace function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

insert into public.invites (code) values ('TEST-A'), ('TEST-B'), ('TEST-C'), ('TEST-D');

select throws_ok(
  $$ insert into auth.users (id, email, raw_user_meta_data) values (gen_random_uuid(), 'x@test.dev', '{}') $$,
  'P0001', 'A valid invite code is required to join Connection', 'signup without an invite is rejected'
);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@test.dev', '{"invite_code":"TEST-A"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@test.dev', '{"invite_code":"TEST-B"}'),
  ('00000000-0000-0000-0000-00000000000c', 'c@test.dev', '{"invite_code":"TEST-C"}');

select throws_ok(
  $$ insert into auth.users (id, email, raw_user_meta_data) values (gen_random_uuid(), 'y@test.dev', '{"invite_code":"TEST-A"}') $$,
  'P0001', null, 'an invite code can only be used once'
);
select is((select count(*)::int from public.profiles), 3, 'profiles are created on signup');

insert into public.invites (code) values ('TEST-DEL');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000de', 'del@test.dev', '{"invite_code":"TEST-DEL"}');
delete from auth.users where id = '00000000-0000-0000-0000-0000000000de';
select is(public.check_invite('TEST-DEL'), false, 'deleting a member does not reactivate their invite');

update public.profiles set display_name = 'Alice', recovery_start_date = current_date - 10 where id = '00000000-0000-0000-0000-00000000000a';
update public.profiles set display_name = 'Bob', recovery_start_date = current_date - 3 where id = '00000000-0000-0000-0000-00000000000b';
update public.profiles set display_name = 'Mod', role = 'moderator' where id = '00000000-0000-0000-0000-00000000000c';

insert into public.check_ins (user_id, date, clean, mood, urge_level, note) values
  ('00000000-0000-0000-0000-00000000000a', current_date, true, 4, 2, 'alice secret note');

-- Alice
select pg_temp.login_as('00000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.profiles), 1, 'members only see their own profile row');
select is((select count(*)::int from public.member_directory), 3, 'members see the display-name directory');
select throws_ok($$ update public.profiles set role = 'admin' where id = auth.uid() $$, '42501', null, 'members cannot change their own role');
select throws_ok($$ select public.set_member_role(auth.uid(), 'admin') $$, 'P0001', null, 'members cannot call set_member_role');
select is((select count(*)::int from public.invites), 0, 'members cannot read invites');
insert into public.posts (author_id, body) values (auth.uid(), 'Day 10, feeling good');
select throws_ok($$ insert into public.posts (author_id, body) values ('00000000-0000-0000-0000-00000000000b', 'spoof') $$, '42501', null, 'members cannot post as someone else');
insert into public.partnerships (requester_id, partner_id) values (auth.uid(), '00000000-0000-0000-0000-00000000000b');
select throws_ok($$ update public.partnerships set status = 'active' $$, 'P0001', null, 'requester cannot accept their own request');

-- Bob
select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.check_ins), 0, 'members cannot read others'' check-ins');
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-00000000000a')), 0, 'pending partners see no check-ins');
update public.partnerships set status = 'active';
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-00000000000a')), 1, 'active partners see shared check-ins');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-00000000000a'), 1, 'active partners can read each other''s profile');
select is((select count(*)::int from public.posts), 1, 'members see community posts');
update public.posts set body = 'hacked';
select is((select body from public.posts limit 1), 'Day 10, feeling good', 'members cannot edit others'' posts');
select throws_ok($$ select public.set_post_removed((select id from public.posts limit 1), true) $$, 'P0001', null, 'members cannot remove posts');

-- Moderator
select pg_temp.login_as('00000000-0000-0000-0000-00000000000c');
select lives_ok($$ select public.set_post_removed((select id from public.posts limit 1), true) $$, 'moderators can remove posts');
select is((select count(*)::int from public.invites where code like 'TEST-%'), 5, 'moderators can read invites');

-- Bob again: removed posts are hidden
select pg_temp.login_as('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.posts), 0, 'removed posts are hidden from other members');

select * from finish();
rollback;
