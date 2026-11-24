-- Accountability partner (F4) security tests. Run with: supabase test db
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

insert into public.invites (code) values ('TEST-P-A'), ('TEST-P-B'), ('TEST-P-C');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000004a1', 'pa@test.dev', '{"invite_code":"TEST-P-A"}'),
  ('00000000-0000-0000-0000-0000000004b2', 'pb@test.dev', '{"invite_code":"TEST-P-B"}'),
  ('00000000-0000-0000-0000-0000000004c3', 'pc@test.dev', '{"invite_code":"TEST-P-C"}');
update public.profiles set display_name = 'Partner A', recovery_start_date = current_date - 10, longest_streak = 40
  where id = '00000000-0000-0000-0000-0000000004a1';
update public.profiles set display_name = 'Partner B', recovery_start_date = current_date - 3
  where id = '00000000-0000-0000-0000-0000000004b2';
update public.profiles set display_name = 'Partner C', recovery_start_date = current_date - 1
  where id = '00000000-0000-0000-0000-0000000004c3';

insert into public.check_ins (user_id, date, clean, mood, urge_level, triggers, note, share_with_partner) values
  ('00000000-0000-0000-0000-0000000004a1', current_date, true, 4, 2, '{stress}', 'a shared-day note', true),
  ('00000000-0000-0000-0000-0000000004a1', current_date - 1, false, 2, 8, '{boredom}', 'a private-day note', false);

select ok(
  position('note' in pg_get_function_result('public.partner_check_ins(uuid, date)'::regprocedure)) = 0,
  'partner_check_ins never returns the journal note'
);

-- A requests B.
select pg_temp.login_as('00000000-0000-0000-0000-0000000004a1');
select throws_ok(
  $$ insert into public.partnerships (requester_id, partner_id) values (auth.uid(), auth.uid()) $$,
  '23514', null, 'members cannot partner with themselves'
);
select throws_ok(
  $$ insert into public.partnerships (requester_id, partner_id) values ('00000000-0000-0000-0000-0000000004c3', '00000000-0000-0000-0000-0000000004b2') $$,
  '42501', null, 'members cannot request on someone else''s behalf'
);
select throws_ok(
  $$ insert into public.partnerships (requester_id, partner_id, status) values (auth.uid(), '00000000-0000-0000-0000-0000000004b2', 'active') $$,
  '42501', null, 'a request cannot skip straight to active'
);
select lives_ok(
  $$ insert into public.partnerships (requester_id, partner_id) values (auth.uid(), '00000000-0000-0000-0000-0000000004b2') $$,
  'members can request a partner'
);
select throws_ok($$ update public.partnerships set status = 'active' $$, 'P0001', null, 'requesters cannot accept their own request');

-- C is not part of the A-B partnership.
select pg_temp.login_as('00000000-0000-0000-0000-0000000004c3');
select is((select count(*)::int from public.partnerships), 0, 'outsiders cannot see other members'' partnerships');
update public.partnerships set status = 'ended';

-- B, while the request is pending.
select pg_temp.login_as('00000000-0000-0000-0000-0000000004b2');
select is((select status::text from public.partnerships), 'pending', 'outsiders cannot change other members'' partnerships');
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-0000000004a1')), 0, 'pending partners see no check-ins');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000004a1'), 0, 'pending partners cannot read the profile');
select throws_ok(
  $$ update public.partnerships set partner_id = '00000000-0000-0000-0000-0000000004c3' $$,
  '42501', null, 'partners cannot swap who the partnership is with'
);
select lives_ok($$ update public.partnerships set status = 'active' $$, 'the invited member can accept');

-- B, now an active partner.
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-0000000004a1', current_date - 30)), 1, 'active partners see only shared check-ins');
select is((select count(*)::int from public.check_ins), 0, 'active partners still cannot read check-in rows (or notes) directly');
select is(
  (select recovery_start_date from public.profiles where id = '00000000-0000-0000-0000-0000000004a1'),
  current_date - 10, 'active partners can read each other''s streak start'
);
select is(
  (select longest_streak from public.profiles where id = '00000000-0000-0000-0000-0000000004a1'),
  40, 'active partners can read each other''s longest streak'
);

-- C cannot see A's data through the partnership.
select pg_temp.login_as('00000000-0000-0000-0000-0000000004c3');
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-0000000004a1', current_date - 30)), 0, 'non-partners see no check-ins');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000004a1'), 0, 'non-partners cannot read the profile');
update public.partnerships set status = 'ended';
delete from public.partnerships;

-- A ends the partnership.
select pg_temp.login_as('00000000-0000-0000-0000-0000000004a1');
select is((select status::text from public.partnerships), 'active', 'outsiders cannot end or delete other members'' partnerships');
select lives_ok($$ update public.partnerships set status = 'ended' $$, 'either partner can end the partnership');

select pg_temp.login_as('00000000-0000-0000-0000-0000000004b2');
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-0000000004a1', current_date - 30)), 0, 'ended partners see no check-ins');
select is((select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000004a1'), 0, 'ended partners cannot read the profile');
select throws_ok($$ update public.partnerships set status = 'active' $$, 'P0001', null, 'an ended partnership cannot be reactivated');

-- A requests C, C declines.
select pg_temp.login_as('00000000-0000-0000-0000-0000000004a1');
insert into public.partnerships (requester_id, partner_id) values (auth.uid(), '00000000-0000-0000-0000-0000000004c3');
select pg_temp.login_as('00000000-0000-0000-0000-0000000004c3');
select lives_ok($$ update public.partnerships set status = 'declined' $$, 'the invited member can decline');
select throws_ok($$ update public.partnerships set status = 'active' $$, 'P0001', null, 'a declined request cannot be accepted later');
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-0000000004a1', current_date - 30)), 0, 'declined requests give no access');

-- Partnerships are kept as history; members cannot delete them.
select pg_temp.login_as('00000000-0000-0000-0000-0000000004a1');
delete from public.partnerships;
select is((select count(*)::int from public.partnerships), 2, 'members cannot delete partnership records');

select * from finish();
rollback;
