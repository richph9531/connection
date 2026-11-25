-- Members cannot choose their own timestamps (e.g. backdating to pin a post).
-- Database admins (migrations, seeding) still can.
create function public.stamp_created_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.created_at := now();
  end if;
  return new;
end;
$$;

create trigger posts_stamp_created_at before insert on public.posts
  for each row execute function public.stamp_created_at();
create trigger comments_stamp_created_at before insert on public.comments
  for each row execute function public.stamp_created_at();
create trigger reactions_stamp_created_at before insert on public.reactions
  for each row execute function public.stamp_created_at();
create trigger reports_stamp_created_at before insert on public.reports
  for each row execute function public.stamp_created_at();

-- Reports survive when the author deletes the reported post or comment, so
-- moderators still see who posted it. They are removed if that author deletes
-- their account.
alter table public.reports
  drop constraint reports_post_id_fkey,
  drop constraint reports_comment_id_fkey,
  add column reported_author_id uuid references public.profiles (id) on delete cascade;

update public.reports r set reported_author_id = coalesce(
  (select p.author_id from public.posts p where p.id = r.post_id),
  (select c.author_id from public.comments c where c.id = r.comment_id)
);

create function public.set_reported_author() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.post_id is not null then
    select author_id into new.reported_author_id from public.posts where id = new.post_id;
  else
    select author_id into new.reported_author_id from public.comments where id = new.comment_id;
  end if;
  if new.reported_author_id is null then
    raise exception 'Reported content not found' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger reports_set_reported_author before insert on public.reports
  for each row execute function public.set_reported_author();

-- Members can only report content they can currently see.
drop policy "Create reports" on public.reports;
create policy "Create reports" on public.reports for insert to authenticated
  with check (
    reporter_id = auth.uid() and status = 'open'
    and (
      exists (select 1 from public.posts p where p.id = post_id and p.removed_at is null)
      or exists (select 1 from public.comments c where c.id = comment_id and c.removed_at is null)
    )
  );
