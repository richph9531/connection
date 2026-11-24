-- Daily check-in privacy tests (F1). Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

create or replace function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

insert into public.invites (code) values ('CHECKIN-A'), ('CHECKIN-B');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000001aa', 'ca@test.dev', '{"invite_code":"CHECKIN-A"}'),
  ('00000000-0000-0000-0000-0000000001bb', 'cb@test.dev', '{"invite_code":"CHECKIN-B"}');
update public.profiles set display_name = 'Check A', recovery_start_date = current_date - 10
  where id = '00000000-0000-0000-0000-0000000001aa';
update public.profiles set display_name = 'Check B', recovery_start_date = current_date - 5
  where id = '00000000-0000-0000-0000-0000000001bb';

-- Member A checks in and edits today's check-in.
select pg_temp.login_as('00000000-0000-0000-0000-0000000001aa');
select lives_ok(
  $$ insert into public.check_ins (user_id, date, clean, mood, urge_level, triggers, note)
     values (auth.uid(), current_date, true, 4, 2, '{stress}', 'a private note') $$,
  'members can save their own check-in'
);
select lives_ok(
  $$ insert into public.check_ins (user_id, date, clean, mood, urge_level, triggers, note, share_with_partner)
     values (auth.uid(), current_date, false, 2, 8, '{boredom}', 'edited note', true)
     on conflict (user_id, date) do update set clean = excluded.clean, mood = excluded.mood,
       urge_level = excluded.urge_level, triggers = excluded.triggers, note = excluded.note $$,
  'members can update today''s check-in'
);
select is((select count(*)::int from public.check_ins), 1, 'only one check-in per day');
select is((select note from public.check_ins), 'edited note', 'the edit is saved');
select throws_ok(
  $$ insert into public.check_ins (user_id, date, clean, mood, urge_level) values (auth.uid(), current_date, true, 3, 1) $$,
  '23505', null, 'a second check-in for the same day is rejected'
);
select throws_ok(
  $$ insert into public.check_ins (user_id, date, clean, mood, urge_level) values (auth.uid(), current_date - 1, true, 6, 1) $$,
  '23514', null, 'mood must be 1-5'
);
select throws_ok(
  $$ insert into public.check_ins (user_id, date, clean, mood, urge_level) values (auth.uid(), current_date - 1, true, 3, 11) $$,
  '23514', null, 'urge level must be 0-10'
);
insert into public.check_ins (user_id, date, clean, mood, urge_level, note, share_with_partner)
  values (auth.uid(), current_date - 1, true, 3, 1, 'unshared note', false);

-- Member B (not a partner) cannot see or touch A's check-ins.
select pg_temp.login_as('00000000-0000-0000-0000-0000000001bb');
select is((select count(*)::int from public.check_ins), 0, 'members cannot read others'' check-ins');
select is(
  (select count(*)::int from public.check_ins where note is not null), 0,
  'members cannot read others'' journal notes'
);
select throws_ok(
  $$ insert into public.check_ins (user_id, date, clean, mood, urge_level)
     values ('00000000-0000-0000-0000-0000000001aa', current_date - 2, true, 3, 1) $$,
  '42501', null, 'members cannot create check-ins for someone else'
);
update public.check_ins set note = 'tampered', clean = true where user_id = '00000000-0000-0000-0000-0000000001aa';
delete from public.check_ins where user_id = '00000000-0000-0000-0000-0000000001aa';
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-0000000001aa')), 0,
  'non-partners cannot read check-ins through partner_check_ins');
insert into public.check_ins (user_id, date, clean, mood, urge_level) values (auth.uid(), current_date, true, 5, 0);
select throws_ok(
  $$ update public.check_ins set user_id = '00000000-0000-0000-0000-0000000001aa' $$,
  '42501', null, 'members cannot move their check-in to someone else'
);
update public.profiles set recovery_start_date = current_date where id = '00000000-0000-0000-0000-0000000001aa';

select pg_temp.logout();
select is(
  (select note from public.check_ins where user_id = '00000000-0000-0000-0000-0000000001aa' and date = current_date),
  'edited note', 'other members cannot edit someone''s check-in'
);
select is(
  (select count(*)::int from public.check_ins where user_id = '00000000-0000-0000-0000-0000000001aa'), 2,
  'other members cannot delete someone''s check-ins'
);
select is(
  (select recovery_start_date from public.profiles where id = '00000000-0000-0000-0000-0000000001aa'),
  current_date - 10, 'other members cannot reset someone''s streak start date'
);

-- Active partners see only shared check-ins and never the note, and still cannot read the table.
insert into public.partnerships (requester_id, partner_id, status)
  values ('00000000-0000-0000-0000-0000000001aa', '00000000-0000-0000-0000-0000000001bb', 'active');
select pg_temp.login_as('00000000-0000-0000-0000-0000000001bb');
select is((select count(*)::int from public.partner_check_ins('00000000-0000-0000-0000-0000000001aa', current_date - 7)), 1,
  'partners only see check-ins shared with them');
select is((select count(*)::int from public.check_ins where user_id = '00000000-0000-0000-0000-0000000001aa'), 0,
  'partners cannot read the check-ins table (and so never the note)');
select ok(
  not exists (
    select 1 from information_schema.routines r
    join information_schema.parameters p on p.specific_name = r.specific_name
    where r.routine_schema = 'public' and r.routine_name = 'partner_check_ins' and p.parameter_name = 'note'
  ),
  'partner_check_ins has no note column'
);

-- Members can reset their own streak start date.
select pg_temp.login_as('00000000-0000-0000-0000-0000000001aa');
select lives_ok(
  $$ update public.profiles set recovery_start_date = current_date, longest_streak = 10 where id = auth.uid() $$,
  'members can restart their own streak'
);

-- Signed-out visitors cannot read check-ins.
select pg_temp.logout();
set local role anon;
select throws_ok($$ select count(*) from public.check_ins $$, '42501', null, 'anonymous visitors cannot read check-ins');

select * from finish();
rollback;
