-- Database-backed owner and administrator roles.
create table if not exists public.yapin_admins (
  user_id uuid primary key references neon_auth."user"(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  granted_by uuid references neon_auth."user"(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists yapin_admins_role_idx
  on public.yapin_admins (role, created_at);
alter table public.yapin_admins enable row level security;
insert into public.yapin_admins (user_id, role, granted_by)
select id, 'owner', id
from neon_auth."user"
where lower(email) = lower('romendraroy4@gmail.com')
on conflict (user_id) do update set role = 'owner';
