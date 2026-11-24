-- Local development only: invite codes for testing signup.
insert into public.invites (code, expires_at) values
  ('LOCAL-INVITE-1', now() + interval '365 days'),
  ('LOCAL-INVITE-2', now() + interval '365 days'),
  ('LOCAL-INVITE-3', now() + interval '365 days');
