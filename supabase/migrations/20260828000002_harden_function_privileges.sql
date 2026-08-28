-- Postgres grants EXECUTE on newly created functions to PUBLIC by default,
-- and Supabase additionally grants EXECUTE directly to anon/authenticated
-- via default privileges — so every function in `public` is reachable as a
-- PostgREST RPC endpoint unless explicitly locked down. Revoke everything,
-- then re-grant only the intended RPC entry points, and only to
-- `authenticated` (every RPC here requires a signed-in user; none should
-- be callable anonymously).
--
-- Left unreachable by any client role: is_group_member / is_group_admin /
-- is_expense_group_member (internal RLS helpers), handle_new_user /
-- handle_new_group / set_updated_at (trigger functions — Postgres invokes
-- these without needing an EXECUTE grant on the triggering role), and
-- recalculate_settlements (called only from confirm_payment/the "expenses"
-- Edge Function's service-role client, both of which bypass grants).
revoke execute on all functions in schema public from anon, authenticated, public;

-- SECURITY DEFINER only changes whose privileges a function's BODY runs
-- with — the caller still needs EXECUTE to invoke it at all, including
-- when Postgres evaluates it from inside an RLS policy as that caller's
-- role. These three gate nearly every RLS policy in the schema, so without
-- this grant every policy that references them fails closed with a
-- confusing "permission denied for function ..." error.
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_admin(uuid) to authenticated;
grant execute on function public.is_expense_group_member(uuid) to authenticated;

grant execute on function public.generate_invite_code() to authenticated;
grant execute on function public.list_group_summaries() to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.regenerate_invite_code(uuid) to authenticated;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;
grant execute on function public.leave_group(uuid) to authenticated;
grant execute on function public.create_payment(uuid, uuid, uuid, numeric, text, text, public.payment_method) to authenticated;
grant execute on function public.confirm_payment(uuid) to authenticated;
grant execute on function public.group_analytics(uuid) to authenticated;
grant execute on function public.personal_dashboard() to authenticated;

-- Make sure future functions don't silently reopen this.
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;
