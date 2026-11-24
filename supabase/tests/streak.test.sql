-- Streak and milestones (F2): members only see and change their own streak data. Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

create or replace function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

insert into public.invites (code) values ('STREAK-A'), ('STREAK-B'), ('STREAK-C');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000002a1', 'sa@test.dev', '{"invite_code":"STREAK-A"}'),
  ('00000000-0000-0000-0000-0000000002b1', 'sb@test.dev', '{"invite_code":"STREAK-B"}'),
  ('00000000-0000-0000-0000-0000000002c1', 'sc@test.dev', '{"invite_code":"STREAK-C"}');
update public.profiles set display_name = 'Streak Alice', recovery_start_date = current_date - 8, longest_streak = 8
  where id = '00000000-0000-0000-0000-0000000002a1';
update public.profiles set display_name = 'Streak Bob', recovery_start_date = current_date - 3
  where id = '00000000-0000-0000-0000-0000000002b1';
update public.profiles set display_name = 'Streak Cara', recovery_start_date = current_date - 1
  where id = '00000000-0000-0000-0000-0000000002c1';

insert into public.check_ins (user_id, date, clean, mood, urge_level, note) values
  ('00000000-0000-0000-0000-0000000002a1', current_date - 1, true, 4, 2, 'alice private'),
  ('00000000-0000-0000-0000-0000000002a1', current_date - 9, false, 2, 8, 'alice private 2'),
  ('00000000-0000-0000-0000-0000000002b1', current_date, true, 3, 1, 'bob private');

insert into public.partnerships (requester_id, partner_id, status) values
  ('00000000-0000-0000-0000-0000000002a1', '00000000-0000-0000-0000-0000000002c1', 'active');

-- Bob (not Alice's partner)
select pg_temp.login_as('00000000-0000-0000-0000-0000000002b1');
select is((select count(*)::int from public.check_ins), 1, 'calendar data: members only read their own check-in results');
select is(
  (select count(*)::int from public.profiles where id = '00000000-0000-0000-0000-0000000002a1'), 0,
  'members cannot read another member''s streak'
);
update public.profiles set longest_streak = 0, recovery_start_date = current_date
  where id = '00000000-0000-0000-0000-0000000002a1';
update public.check_ins set clean = false where user_id = '00000000-0000-0000-0000-0000000002a1';
select throws_ok(
  $$ insert into public.check_ins (user_id, date, clean, mood, urge_level)
     values ('00000000-0000-0000-0000-0000000002a1', current_date, false, 1, 9) $$,
  '42501', null, 'members cannot add check-ins to another member''s calendar'
);
select throws_ok(
  $$ insert into public.posts (author_id, body, milestone_days)
     values ('00000000-0000-0000-0000-0000000002a1', 'fake milestone', 7) $$,
  '42501', null, 'members cannot share a milestone as someone else'
);
select is(
  (select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-0000000002a1')), 0,
  'non-partners cannot read shared check-ins'
);

-- Alice
select pg_temp.login_as('00000000-0000-0000-0000-0000000002a1');
select results_eq(
  $$ select longest_streak, recovery_start_date from public.profiles where id = auth.uid() $$,
  $$ values (8, current_date - 8) $$,
  'another member cannot change my streak or start date'
);
select is(
  (select count(*)::int from public.check_ins where clean),
  1, 'another member cannot change my check-in results'
);
select is((select count(*)::int from public.check_ins), 2, 'members read their own check-in results for the calendar');
select lives_ok(
  $$ update public.profiles set longest_streak = 9 where id = auth.uid() $$,
  'members can save their own longest streak'
);
select is((select longest_streak from public.profiles where id = auth.uid()), 9, 'the longest streak is saved');
select throws_ok(
  $$ update public.profiles set longest_streak = -1 where id = auth.uid() $$,
  '23514', null, 'the longest streak cannot be negative'
);
select lives_ok(
  $$ insert into public.posts (author_id, body, milestone_days) values (auth.uid(), 'I reached 7 days!', 7) $$,
  'members can share their own milestone'
);

-- Bob cannot remove Alice's milestone post.
select pg_temp.login_as('00000000-0000-0000-0000-0000000002b1');
select is((select count(*)::int from public.posts where milestone_days = 7), 1, 'shared milestones are visible to members');
delete from public.posts where milestone_days = 7;
select pg_temp.logout();
select is((select count(*)::int from public.posts where milestone_days = 7), 1, 'members cannot delete another member''s milestone');

-- Cara (Alice's active partner)
select pg_temp.login_as('00000000-0000-0000-0000-0000000002c1');
select is(
  (select longest_streak from public.profiles where id = '00000000-0000-0000-0000-0000000002a1'), 9,
  'active partners can see each other''s streak'
);
select is((select count(*)::int from public.check_ins), 0, 'partners cannot read the check-ins table (or notes) directly');

select * from finish();
rollback;
