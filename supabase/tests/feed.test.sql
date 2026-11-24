-- Community feed security tests (posts, comments, reactions, reports). Run with: supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

create or replace function pg_temp.login_as(uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
$$;
create or replace function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

insert into public.invites (code) values ('FEED-A'), ('FEED-B'), ('FEED-M');
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000f1', 'fa@test.dev', '{"invite_code":"FEED-A"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'fb@test.dev', '{"invite_code":"FEED-B"}'),
  ('00000000-0000-0000-0000-0000000000f3', 'fm@test.dev', '{"invite_code":"FEED-M"}');
update public.profiles set display_name = 'Feed Alice' where id = '00000000-0000-0000-0000-0000000000f1';
update public.profiles set display_name = 'Feed Bob' where id = '00000000-0000-0000-0000-0000000000f2';
update public.profiles set display_name = 'Feed Mod', role = 'moderator' where id = '00000000-0000-0000-0000-0000000000f3';

-- Alice writes a post, a reply and a reaction.
select pg_temp.login_as('00000000-0000-0000-0000-0000000000f1');
select lives_ok(
  $$ insert into public.posts (id, author_id, body) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'Day 12, a good week') $$,
  'members can post as themselves'
);
select throws_ok(
  $$ insert into public.posts (author_id, body) values ('00000000-0000-0000-0000-0000000000f2', 'spoof') $$,
  '42501', null, 'members cannot post as someone else'
);
select throws_ok(
  $$ insert into public.posts (author_id, body, removed_at) values (auth.uid(), 'sneaky', now()) $$,
  '42501', null, 'members cannot create pre-removed posts'
);
select throws_ok(
  $$ insert into public.posts (author_id, body) values (auth.uid(), repeat('a', 2001)) $$,
  '23514', null, 'posts are limited to 2000 characters'
);
select throws_ok(
  $$ update public.posts set removed_at = null, removed_by = null where author_id = auth.uid() $$,
  '42501', null, 'authors cannot change moderation fields on their posts'
);
select throws_ok(
  $$ update public.posts set author_id = '00000000-0000-0000-0000-0000000000f2' where author_id = auth.uid() $$,
  '42501', null, 'authors cannot hand their post to someone else'
);
select lives_ok(
  $$ insert into public.comments (id, post_id, author_id, body) values ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', auth.uid(), 'Thanks all') $$,
  'members can reply as themselves'
);
select lives_ok(
  $$ insert into public.reactions (post_id, user_id, kind) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'support') $$,
  'members can react as themselves'
);
select throws_ok(
  $$ insert into public.reactions (post_id, user_id, kind) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'support') $$,
  '23505', null, 'each reaction kind counts once per member'
);
select throws_ok(
  $$ insert into public.reactions (post_id, user_id, kind) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f2', 'prayer') $$,
  '42501', null, 'members cannot react as someone else'
);

-- Bob can read and respond, but not touch Alice's content.
select pg_temp.login_as('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.posts), 1, 'members see community posts');
select is((select count(*)::int from public.comments), 1, 'members see replies');
select is((select count(*)::int from public.reactions), 1, 'members see reactions');
select throws_ok(
  $$ insert into public.comments (post_id, author_id, body) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'spoof') $$,
  '42501', null, 'members cannot reply as someone else'
);
update public.posts set body = 'hacked';
update public.comments set body = 'hacked';
select is((select body from public.posts where id = '00000000-0000-0000-0000-0000000000a1'), 'Day 12, a good week', 'members cannot edit others'' posts');
select is((select body from public.comments where id = '00000000-0000-0000-0000-0000000000c1'), 'Thanks all', 'members cannot edit others'' replies');
delete from public.posts;
delete from public.comments;
delete from public.reactions;
select is((select count(*)::int from public.posts), 1, 'members cannot delete others'' posts');
select is((select count(*)::int from public.comments), 1, 'members cannot delete others'' replies');
select is((select count(*)::int from public.reactions), 1, 'members cannot remove others'' reactions');

insert into public.comments (id, post_id, author_id, body) values
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a1', auth.uid(), 'Proud of you');
insert into public.reactions (post_id, user_id, kind) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'strength');
select lives_ok(
  $$ insert into public.reports (post_id, reporter_id, reason) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'test') $$,
  'members can report a post'
);
select lives_ok(
  $$ insert into public.reports (comment_id, reporter_id, reason) values ('00000000-0000-0000-0000-0000000000c1', auth.uid(), 'test') $$,
  'members can report a reply'
);
select throws_ok(
  $$ insert into public.reports (post_id, reporter_id, reason) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', 'spoof') $$,
  '42501', null, 'members cannot report in someone else''s name'
);
select throws_ok(
  $$ insert into public.reports (post_id, reporter_id, reason, status) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'x', 'resolved') $$,
  '42501', null, 'members cannot file an already-resolved report'
);
select throws_ok(
  $$ insert into public.reports (post_id, comment_id, reporter_id, reason) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000c1', auth.uid(), 'x') $$,
  '23514', null, 'a report targets exactly one post or reply'
);
select is((select count(*)::int from public.reports), 0, 'members cannot read reports, not even their own');
select throws_ok(
  $$ select public.set_comment_removed('00000000-0000-0000-0000-0000000000c1', true) $$,
  'P0001', null, 'members cannot remove replies'
);

-- Alice cannot read who reported her.
select pg_temp.login_as('00000000-0000-0000-0000-0000000000f1');
select is((select count(*)::int from public.reports), 0, 'authors cannot see reports about their content');

-- Moderator sees reports and hides Alice's reply.
select pg_temp.login_as('00000000-0000-0000-0000-0000000000f3');
select is((select count(*)::int from public.reports), 2, 'moderators see reports');
select lives_ok($$ select public.set_comment_removed('00000000-0000-0000-0000-0000000000c1', true) $$, 'moderators can remove replies');

select pg_temp.login_as('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.comments), 1, 'removed replies are hidden from other members');
select pg_temp.login_as('00000000-0000-0000-0000-0000000000f1');
select is((select count(*)::int from public.comments), 2, 'authors still see their own removed reply');

-- Moderator hides the post.
select pg_temp.login_as('00000000-0000-0000-0000-0000000000f3');
select public.set_post_removed('00000000-0000-0000-0000-0000000000a1', true);

select pg_temp.login_as('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.posts), 0, 'removed posts are hidden from other members');
select throws_ok(
  $$ insert into public.comments (post_id, author_id, body) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'late') $$,
  '42501', null, 'members cannot reply to removed posts'
);
select throws_ok(
  $$ insert into public.reactions (post_id, user_id, kind) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'prayer') $$,
  '42501', null, 'members cannot react to removed posts'
);

select pg_temp.login_as('00000000-0000-0000-0000-0000000000f1');
select is((select count(*)::int from public.posts), 1, 'authors still see their own removed post');
select lives_ok(
  $$ delete from public.posts where id = '00000000-0000-0000-0000-0000000000a1' $$,
  'authors can delete their own post'
);
select pg_temp.logout();
select is((select count(*)::int from public.comments where post_id = '00000000-0000-0000-0000-0000000000a1'), 0, 'deleting a post deletes its replies');

-- Logged-out visitors cannot read the feed.
set local role anon;
select throws_ok($$ select count(*) from public.posts $$, '42501', null, 'visitors cannot read posts');
select throws_ok($$ select count(*) from public.comments $$, '42501', null, 'visitors cannot read replies');
reset role;

select * from finish();
rollback;
