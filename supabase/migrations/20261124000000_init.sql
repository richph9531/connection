-- Connection: initial schema, row level security and helper functions.

create type public.member_role as enum ('member', 'moderator', 'admin');
create type public.partnership_status as enum ('pending', 'active', 'declined', 'ended');
create type public.report_status as enum ('open', 'resolved', 'dismissed');
create type public.reaction_kind as enum ('support', 'strength', 'prayer', 'well_done');

-- Tables -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text unique check (display_name ~ '^[A-Za-z0-9_ .-]{3,30}$'),
  role public.member_role not null default 'member',
  recovery_start_date date,
  longest_streak integer not null default 0 check (longest_streak >= 0),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table public.invites (
  code text primary key check (char_length(code) between 6 and 64),
  created_by uuid references public.profiles (id) on delete set null,
  used_by uuid references public.profiles (id) on delete set null,
  used_at timestamptz,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);

create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  clean boolean not null,
  mood smallint not null check (mood between 1 and 5),
  urge_level smallint not null check (urge_level between 0 and 10),
  triggers text[] not null default '{}',
  note text check (char_length(note) <= 5000),
  share_with_partner boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  milestone_days integer,
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references public.profiles (id) on delete set null
);
create index posts_created_at_idx on public.posts (created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references public.profiles (id) on delete set null
);
create index comments_post_id_idx on public.comments (post_id, created_at);

create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.reaction_kind not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

create table public.partnerships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  partner_id uuid not null references public.profiles (id) on delete cascade,
  status public.partnership_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> partner_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  check (num_nonnulls(post_id, comment_id) = 1)
);

-- Helper functions -----------------------------------------------------------

create function public.is_moderator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- True while the signed-in user still has a member profile (false after account deletion).
create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create function public.is_active_partner(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.partnerships
    where status = 'active'
      and ((requester_id = auth.uid() and partner_id = other)
        or (partner_id = auth.uid() and requester_id = other))
  );
$$;

-- Lets the signup form check a code before sending the magic link.
create function public.check_invite(invite_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.invites
    where code = invite_code and used_at is null and expires_at > now()
  );
$$;

-- Invite-only signup: every new auth user must carry a valid invite code.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  invite_code text := new.raw_user_meta_data ->> 'invite_code';
begin
  if invite_code is null or not exists (
    select 1 from public.invites
    where code = invite_code and used_at is null and expires_at > now()
    for update
  ) then
    raise exception 'A valid invite code is required to join Connection';
  end if;

  insert into public.profiles (id) values (new.id);
  update public.invites set used_by = new.id, used_at = now() where code = invite_code;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_member_role(member uuid, new_role public.member_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change roles';
  end if;
  update public.profiles set role = new_role where id = member;
end;
$$;

create function public.set_post_removed(target uuid, removed boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can remove posts';
  end if;
  update public.posts
  set removed_at = case when removed then now() end,
      removed_by = case when removed then auth.uid() end
  where id = target;
end;
$$;

create function public.set_comment_removed(target uuid, removed boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_moderator() then
    raise exception 'Only moderators can remove comments';
  end if;
  update public.comments
  set removed_at = case when removed then now() end,
      removed_by = case when removed then auth.uid() end
  where id = target;
end;
$$;

-- Partner view of shared check-ins. Never returns the private journal note.
create function public.partner_check_ins(partner uuid, since date default current_date - 30)
returns table (date date, clean boolean, mood smallint, urge_level smallint, triggers text[])
language sql stable security definer set search_path = '' as $$
  select c.date, c.clean, c.mood, c.urge_level, c.triggers
  from public.check_ins c
  where c.user_id = partner
    and c.share_with_partner
    and c.date >= since
    and public.is_active_partner(partner)
  order by c.date desc;
$$;

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Partnership status changes: only the invited partner accepts/declines; either ends.
create function public.validate_partnership_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.requester_id <> old.requester_id or new.partner_id <> old.partner_id then
    raise exception 'Partnership members cannot change';
  end if;
  if old.status = 'pending' and new.status in ('active', 'declined') and auth.uid() = old.partner_id then
    null;
  elsif old.status in ('pending', 'active') and new.status = 'ended' then
    null;
  elsif new.status = old.status then
    null;
  else
    raise exception 'Invalid partnership status change';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger partnerships_validate_update
  before update on public.partnerships
  for each row execute function public.validate_partnership_update();

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger check_ins_touch_updated_at
  before update on public.check_ins
  for each row execute function public.touch_updated_at();

-- Display names visible to all signed-in members (no private fields).
create view public.member_directory as
  select id, display_name, role from public.profiles
  where display_name is not null and public.is_member();

-- Privileges -----------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from anon, public;
grant execute on function public.check_invite(text) to anon, authenticated;
grant execute on function
  public.is_member(), public.is_moderator(), public.is_admin(), public.is_active_partner(uuid),
  public.set_member_role(uuid, public.member_role),
  public.set_post_removed(uuid, boolean), public.set_comment_removed(uuid, boolean),
  public.partner_check_ins(uuid, date), public.delete_my_account()
  to authenticated;

revoke all on public.member_directory from authenticated;
grant select on public.member_directory to authenticated;

revoke update on public.profiles from authenticated;
grant update (display_name, recovery_start_date, longest_streak, timezone)
  on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated;

revoke update on public.posts, public.comments from authenticated;
grant update (body) on public.posts, public.comments to authenticated;

revoke update on public.partnerships from authenticated;
grant update (status) on public.partnerships to authenticated;

-- Row level security -----------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.invites enable row level security;
alter table public.check_ins enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.partnerships enable row level security;
alter table public.reports enable row level security;

create policy "Read own, partner or as moderator" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_active_partner(id) or public.is_moderator());
create policy "Update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Moderators read invites" on public.invites for select to authenticated
  using (public.is_moderator());
create policy "Moderators create invites" on public.invites for insert to authenticated
  with check (public.is_moderator() and created_by = auth.uid() and used_by is null and used_at is null);
create policy "Moderators delete unused invites" on public.invites for delete to authenticated
  using (public.is_moderator() and used_at is null);

create policy "Own check-ins" on public.check_ins for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Read visible posts" on public.posts for select to authenticated
  using (public.is_member() and (removed_at is null or author_id = auth.uid() or public.is_moderator()));
create policy "Create own posts" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and removed_at is null and removed_by is null);
create policy "Edit own posts" on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Delete own posts" on public.posts for delete to authenticated
  using (author_id = auth.uid());

-- Comments and reactions are only visible on posts the reader can see.
create policy "Read visible comments" on public.comments for select to authenticated
  using (
    (removed_at is null or author_id = auth.uid() or public.is_moderator())
    and exists (select 1 from public.posts p where p.id = post_id)
  );
create policy "Create own comments" on public.comments for insert to authenticated
  with check (
    author_id = auth.uid() and removed_at is null and removed_by is null
    and exists (select 1 from public.posts p where p.id = post_id and p.removed_at is null)
  );
create policy "Edit own comments" on public.comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Delete own comments" on public.comments for delete to authenticated
  using (author_id = auth.uid());

create policy "Read reactions" on public.reactions for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "Add own reactions" on public.reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.posts p where p.id = post_id and p.removed_at is null)
  );
create policy "Remove own reactions" on public.reactions for delete to authenticated
  using (user_id = auth.uid());

create policy "Read own partnerships" on public.partnerships for select to authenticated
  using (auth.uid() in (requester_id, partner_id));
create policy "Request a partner" on public.partnerships for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending');
create policy "Update own partnerships" on public.partnerships for update to authenticated
  using (auth.uid() in (requester_id, partner_id));

create policy "Create reports" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy "Moderators read reports" on public.reports for select to authenticated
  using (public.is_moderator());
create policy "Moderators update reports" on public.reports for update to authenticated
  using (public.is_moderator());
