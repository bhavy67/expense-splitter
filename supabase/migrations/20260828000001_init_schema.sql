-- Expense Splitter — initial schema, RLS, triggers, and RPC functions.
-- Auth (users) is handled entirely by Supabase Auth (auth.users); public.profiles
-- mirrors it for app-facing fields (name, avatar_url) and FK targets.

-- ── Enums ────────────────────────────────────────────────────────────────
create type public.group_type as enum ('travel','roommates','friends','dinner','other');
create type public.member_role as enum ('admin','member');
create type public.split_type as enum ('equal','percentage','exact','itemized');
create type public.expense_category as enum ('food','travel','accommodation','utilities','entertainment','other');
create type public.audit_action as enum ('created','updated','deleted','restored');
create type public.payment_method as enum ('cash','upi','razorpay','bank_transfer','other');

-- ── Helper functions (used by defaults + RLS policies) ──────────────────
-- gen_random_uuid() is built into Postgres core (13+) — no extension needed.

create or replace function public.generate_invite_code() returns text
language sql volatile as $$
  select replace(gen_random_uuid()::text, '-', '')
$$;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Tables ────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.currencies (
  code text primary key,
  symbol text not null,
  name text not null,
  is_default boolean not null default false
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type public.group_type not null default 'other',
  currency_code text not null default 'INR' references public.currencies(code),
  invite_code text not null unique default public.generate_invite_code(),
  created_by uuid not null default auth.uid() references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'member',
  joined_at timestamptz not null default now(),
  is_active boolean not null default true,
  primary key (group_id, user_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  description text,
  total_amount numeric(12,2) not null check (total_amount > 0),
  currency_code text not null default 'INR' references public.currencies(code),
  split_type public.split_type not null default 'equal',
  category public.expense_category not null default 'other',
  paid_by uuid not null references public.profiles(id),
  expense_date date not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index expenses_group_id_idx on public.expenses(group_id);

create table public.expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index expense_items_expense_id_idx on public.expense_items(expense_id);

create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  expense_item_id uuid references public.expense_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null,
  percentage numeric(5,2)
);
create index expense_splits_expense_id_idx on public.expense_splits(expense_id);
create index expense_splits_item_id_idx on public.expense_splits(expense_item_id);

create table public.expense_payers (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null
);
create index expense_payers_expense_id_idx on public.expense_payers(expense_id);

create table public.expense_audit (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  changed_by uuid not null references public.profiles(id),
  action public.audit_action not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);
create index expense_audit_expense_id_idx on public.expense_audit(expense_id);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id),
  to_user_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null,
  currency_code text not null references public.currencies(code),
  computed_at timestamptz not null default now(),
  unique (group_id, from_user_id, to_user_id)
);
create index settlements_group_id_idx on public.settlements(group_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id),
  to_user_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null,
  currency_code text not null default 'INR' references public.currencies(code),
  note text,
  payment_method public.payment_method not null default 'cash',
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index payments_group_id_idx on public.payments(group_id);

-- ── updated_at triggers ──────────────────────────────────────────────────
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.groups
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

-- ── Seed data ────────────────────────────────────────────────────────────
insert into public.currencies (code, symbol, name, is_default) values
  ('INR', '₹', 'Indian Rupee', true);

-- ── auth.users -> public.profiles ───────────────────────────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- New group -> creator becomes admin member automatically.
create or replace function public.handle_new_group() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- ── RLS helper functions (security definer to avoid recursive policy checks) ──
create or replace function public.is_group_member(p_group_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and is_active
  )
$$;

create or replace function public.is_group_admin(p_group_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and is_active and role = 'admin'
  )
$$;

create or replace function public.is_expense_group_member(p_expense_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from public.expenses e
    where e.id = p_expense_id and public.is_group_member(e.group_id)
  )
$$;

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.currencies enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_items enable row level security;
alter table public.expense_splits enable row level security;
alter table public.expense_payers enable row level security;
alter table public.expense_audit enable row level security;
alter table public.settlements enable row level security;
alter table public.payments enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy currencies_select on public.currencies for select to authenticated using (true);

create policy groups_select on public.groups for select to authenticated
  using (public.is_group_member(id) or created_by = auth.uid());
create policy groups_insert on public.groups for insert to authenticated
  with check (created_by = auth.uid());
create policy groups_update on public.groups for update to authenticated
  using (public.is_group_admin(id)) with check (public.is_group_admin(id));

-- group_members writes only happen via SECURITY DEFINER RPCs/triggers below —
-- no insert/update/delete policy for the authenticated role on purpose.
create policy group_members_select on public.group_members for select to authenticated
  using (public.is_group_member(group_id) or user_id = auth.uid());

-- expenses (+ children) are only ever written by the "expenses" Edge Function,
-- which uses the service-role key and therefore bypasses RLS entirely.
create policy expenses_select on public.expenses for select to authenticated
  using (public.is_group_member(group_id));
create policy expense_items_select on public.expense_items for select to authenticated
  using (public.is_expense_group_member(expense_id));
create policy expense_splits_select on public.expense_splits for select to authenticated
  using (public.is_expense_group_member(expense_id));
create policy expense_payers_select on public.expense_payers for select to authenticated
  using (public.is_expense_group_member(expense_id));
create policy expense_audit_select on public.expense_audit for select to authenticated
  using (public.is_expense_group_member(expense_id));

-- settlements/payments writes only happen via SECURITY DEFINER RPCs below.
create policy settlements_select on public.settlements for select to authenticated
  using (public.is_group_member(group_id));
create policy payments_select on public.payments for select to authenticated
  using (public.is_group_member(group_id));

-- ── Realtime: expose row changes for live group updates ────────────────
alter table public.expenses replica identity full;
alter table public.settlements replica identity full;
alter table public.payments replica identity full;
alter table public.group_members replica identity full;

alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.group_members;

-- ── RPC: settlement engine ───────────────────────────────────────────────
-- Rebuilds the settlement cache for a group: net balance per user from
-- expenses (minus splits) + confirmed payments, then a greedy
-- minimize-transactions match (largest creditor <-> largest debtor).
create or replace function public.recalculate_settlements(p_group_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_currency text;
  creditors uuid[];
  credit_amts numeric[];
  debtors uuid[];
  debit_amts numeric[];
  ci int := 1;
  di int := 1;
  amt numeric;
begin
  select currency_code into v_currency from public.groups where id = p_group_id;

  create temporary table if not exists tmp_net (user_id uuid primary key, net numeric(14,2)) on commit drop;
  delete from tmp_net;

  insert into tmp_net (user_id, net)
  select user_id, sum(contrib_amt) from (
    select payer.user_id, payer.amount as contrib_amt
    from public.expense_payers payer
    join public.expenses e on e.id = payer.expense_id
    where e.group_id = p_group_id and e.deleted_at is null

    union all

    select e.paid_by, e.total_amount
    from public.expenses e
    where e.group_id = p_group_id and e.deleted_at is null
      and not exists (select 1 from public.expense_payers p where p.expense_id = e.id)

    union all

    select s.user_id, -s.amount
    from public.expense_splits s
    join public.expenses e on e.id = s.expense_id
    where e.group_id = p_group_id and e.deleted_at is null

    union all

    select from_user_id, amount from public.payments
    where group_id = p_group_id and confirmed_at is not null

    union all

    select to_user_id, -amount from public.payments
    where group_id = p_group_id and confirmed_at is not null
  ) contributions
  group by user_id;

  delete from public.settlements where group_id = p_group_id;

  select array_agg(user_id order by net desc), array_agg(net order by net desc)
    into creditors, credit_amts
    from tmp_net where net > 0.01;

  select array_agg(user_id order by net asc), array_agg(-net order by net asc)
    into debtors, debit_amts
    from tmp_net where net < -0.01;

  while ci <= coalesce(array_length(creditors, 1), 0) and di <= coalesce(array_length(debtors, 1), 0) loop
    amt := least(credit_amts[ci], debit_amts[di]);

    insert into public.settlements (group_id, from_user_id, to_user_id, amount, currency_code)
    values (p_group_id, debtors[di], creditors[ci], amt, v_currency);

    credit_amts[ci] := credit_amts[ci] - amt;
    debit_amts[di] := debit_amts[di] - amt;

    if credit_amts[ci] < 0.01 then ci := ci + 1; end if;
    if debit_amts[di] < 0.01 then di := di + 1; end if;
  end loop;
end;
$$;

-- ── RPC: groups ──────────────────────────────────────────────────────────
create or replace function public.list_group_summaries() returns table (
  id uuid, name text, type text, currency_code text, member_count bigint,
  total_expenses numeric, you_owe numeric, owed_to_you numeric
)
language sql stable set search_path = public as $$
  select
    g.id, g.name, g.type::text, g.currency_code,
    (select count(*) from public.group_members gm2 where gm2.group_id = g.id and gm2.is_active) as member_count,
    coalesce((select sum(e.total_amount) from public.expenses e where e.group_id = g.id and e.deleted_at is null), 0) as total_expenses,
    coalesce((select sum(s.amount) from public.settlements s where s.group_id = g.id and s.from_user_id = auth.uid()), 0) as you_owe,
    coalesce((select sum(s.amount) from public.settlements s where s.group_id = g.id and s.to_user_id = auth.uid()), 0) as owed_to_you
  from public.groups g
  join public.group_members gm on gm.group_id = g.id
  where gm.user_id = auth.uid() and gm.is_active and g.deleted_at is null
$$;

create or replace function public.join_group(p_invite_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_group_id uuid;
  v_active boolean;
begin
  select id into v_group_id from public.groups
    where invite_code = p_invite_code and deleted_at is null;
  if v_group_id is null then
    raise exception 'Invalid invite link' using errcode = 'P0002';
  end if;

  select is_active into v_active from public.group_members
    where group_id = v_group_id and user_id = auth.uid();

  if v_active is true then
    raise exception 'Already a member' using errcode = '23505';
  elsif v_active is false then
    update public.group_members set is_active = true
      where group_id = v_group_id and user_id = auth.uid();
  else
    insert into public.group_members (group_id, user_id, role)
      values (v_group_id, auth.uid(), 'member');
  end if;

  return v_group_id;
end;
$$;

create or replace function public.regenerate_invite_code(p_group_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  v_code := public.generate_invite_code();
  update public.groups set invite_code = v_code
    where id = p_group_id and deleted_at is null;
  if not found then
    raise exception 'Group not found' using errcode = 'P0002';
  end if;

  return v_code;
end;
$$;

create or replace function public.remove_group_member(p_group_id uuid, p_user_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Cannot remove yourself' using errcode = '22023';
  end if;

  update public.group_members set is_active = false
    where group_id = p_group_id and user_id = p_user_id and is_active;
  if not found then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.leave_group(p_group_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_role public.member_role;
  v_active_count int;
  v_admin_count int;
begin
  select role into v_role from public.group_members
    where group_id = p_group_id and user_id = auth.uid() and is_active;
  if v_role is null then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  if v_role = 'admin' then
    select count(*) into v_active_count from public.group_members
      where group_id = p_group_id and is_active;
    if v_active_count <= 1 then
      raise exception 'You are the only member — delete the group instead' using errcode = '22023';
    end if;

    select count(*) into v_admin_count from public.group_members
      where group_id = p_group_id and role = 'admin' and is_active;
    if v_admin_count <= 1 then
      raise exception 'Transfer admin to another member before leaving' using errcode = '22023';
    end if;
  end if;

  update public.group_members set is_active = false
    where group_id = p_group_id and user_id = auth.uid();
end;
$$;

-- ── RPC: payments ────────────────────────────────────────────────────────
create or replace function public.create_payment(
  p_group_id uuid,
  p_from_user_id uuid,
  p_to_user_id uuid,
  p_amount numeric,
  p_currency_code text default 'INR',
  p_note text default null,
  p_payment_method public.payment_method default 'cash'
) returns public.payments
language plpgsql security definer set search_path = public as $$
declare
  v_row public.payments;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  insert into public.payments (group_id, from_user_id, to_user_id, amount, currency_code, note, payment_method)
  values (p_group_id, p_from_user_id, p_to_user_id, p_amount, p_currency_code, p_note, p_payment_method)
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.confirm_payment(p_payment_id uuid) returns public.payments
language plpgsql security definer set search_path = public as $$
declare
  v_row public.payments;
begin
  select * into v_row from public.payments where id = p_payment_id;
  if v_row.id is null then
    raise exception 'Payment not found' using errcode = 'P0002';
  end if;
  if v_row.to_user_id <> auth.uid() then
    raise exception 'Only the recipient can confirm' using errcode = '42501';
  end if;
  if v_row.confirmed_at is not null then
    raise exception 'Already confirmed' using errcode = '23505';
  end if;

  update public.payments set confirmed_at = now()
    where id = p_payment_id returning * into v_row;

  perform public.recalculate_settlements(v_row.group_id);
  return v_row;
end;
$$;

-- ── RPC: analytics ───────────────────────────────────────────────────────
create or replace function public.group_analytics(p_group_id uuid) returns jsonb
language plpgsql stable set search_path = public as $$
declare
  result jsonb;
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Not a member of this group' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'by_category', (
      select coalesce(jsonb_object_agg(category, total), '{}'::jsonb)
      from (
        select category::text, sum(total_amount) as total
        from public.expenses
        where group_id = p_group_id and deleted_at is null
        group by category
      ) t
    ),
    'by_payer', (
      select coalesce(jsonb_object_agg(paid_by::text, total), '{}'::jsonb)
      from (
        select paid_by, sum(total_amount) as total
        from public.expenses
        where group_id = p_group_id and deleted_at is null
        group by paid_by
      ) t
    ),
    'monthly', (
      -- most recent 6 calendar months with spend, oldest-first for the trend chart
      select coalesce(jsonb_agg(jsonb_build_object('month', month, 'total', total) order by month asc), '[]'::jsonb)
      from (
        select to_char(date_trunc('month', expense_date), 'YYYY-MM-DD') as month, sum(total_amount) as total
        from public.expenses
        where group_id = p_group_id and deleted_at is null
        group by 1
        order by 1 desc
        limit 6
      ) t
    )
  ) into result;

  return result;
end;
$$;

create or replace function public.personal_dashboard() returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
    'total_you_owe', coalesce(round((
      select sum(s.amount) from public.settlements s
      where s.from_user_id = auth.uid()
        and s.group_id in (select group_id from public.group_members where user_id = auth.uid() and is_active)
    ), 2), 0),
    'total_owed_to_you', coalesce(round((
      select sum(s.amount) from public.settlements s
      where s.to_user_id = auth.uid()
        and s.group_id in (select group_id from public.group_members where user_id = auth.uid() and is_active)
    ), 2), 0),
    'group_count', (select count(*) from public.group_members where user_id = auth.uid() and is_active)
  ) || jsonb_build_object(
    'net', coalesce(round((
      select sum(s.amount) from public.settlements s
      where s.to_user_id = auth.uid()
        and s.group_id in (select group_id from public.group_members where user_id = auth.uid() and is_active)
    ), 2), 0) - coalesce(round((
      select sum(s.amount) from public.settlements s
      where s.from_user_id = auth.uid()
        and s.group_id in (select group_id from public.group_members where user_id = auth.uid() and is_active)
    ), 2), 0)
  )
$$;

-- ── Grants ───────────────────────────────────────────────────────────────
-- RLS is the real gate; these grants just allow the authenticated role to
-- attempt the operations that RLS policies (or SECURITY DEFINER RPCs) permit.
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert, update on public.profiles, public.groups to authenticated;
grant execute on all functions in schema public to authenticated;
