alter table public.mj_jobs add column if not exists next_action_assignee public.mj_manager;
alter table public.mj_activities add column if not exists next_action_assignee public.mj_manager;
