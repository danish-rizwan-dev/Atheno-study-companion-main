-- Enable UUID extension for generating IDs
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. COURSES TABLE
-- ==========================================
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  semester text,
  syllabus_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.courses enable row level security;

-- Policies
create policy "Users can view their own courses" 
  on public.courses for select using (auth.uid() = user_id);

create policy "Users can insert their own courses" 
  on public.courses for insert with check (auth.uid() = user_id);

create policy "Users can update their own courses" 
  on public.courses for update using (auth.uid() = user_id);

create policy "Users can delete their own courses" 
  on public.courses for delete using (auth.uid() = user_id);


-- ==========================================
-- 2. ROADMAPS TABLE
-- ==========================================
create table public.roadmaps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete set null,
  original_roadmap_id uuid references public.roadmaps(id) on delete set null, -- For copied/forked roadmaps
  title text not null,
  description text, -- Stores the raw JSON structure of modules/topics
  is_course_related boolean default false,
  is_public boolean default false,
  progress jsonb default '{}'::jsonb, -- Stores completion status: {"1": true, "2": false}
  xp integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.roadmaps enable row level security;

-- Policies
create policy "Users can view their own roadmaps" 
  on public.roadmaps for select using (auth.uid() = user_id);

-- Allow viewing public roadmaps (for sharing feature)
create policy "Users can view public roadmaps" 
  on public.roadmaps for select using (is_public = true);

create policy "Users can insert their own roadmaps" 
  on public.roadmaps for insert with check (auth.uid() = user_id);

create policy "Users can update their own roadmaps" 
  on public.roadmaps for update using (auth.uid() = user_id);

create policy "Users can delete their own roadmaps" 
  on public.roadmaps for delete using (auth.uid() = user_id);


-- ==========================================
-- 3. FLASHCARD SETS TABLE
-- ==========================================
create table public.flashcard_sets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete set null,
  roadmap_item_id uuid references public.roadmaps(id) on delete set null,
  title text not null,
  topic text,
  description text,
  num_cards integer default 0,
  last_reviewed timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.flashcard_sets enable row level security;

-- Policies
create policy "Users can manage their own flashcard sets" 
  on public.flashcard_sets for all using (auth.uid() = user_id);


-- ==========================================
-- 4. FLASHCARDS TABLE
-- ==========================================
create table public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  set_id uuid references public.flashcard_sets(id) on delete cascade not null,
  front_content text not null,
  back_content text not null,
  hint text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.flashcards enable row level security;

-- Policies (Access controlled via set ownership)
create policy "Users can manage flashcards in their sets" 
  on public.flashcards for all using (
    exists (
      select 1 from public.flashcard_sets 
      where id = flashcards.set_id and user_id = auth.uid()
    )
  );


-- ==========================================
-- 5. TASKS TABLE
-- ==========================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  description text,
  due_date timestamp with time zone,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  status text check (status in ('pending', 'in-progress', 'completed')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.tasks enable row level security;

-- Policies
create policy "Users can manage their own tasks" 
  on public.tasks for all using (auth.uid() = user_id);


-- ==========================================
-- 6. POMODORO SESSIONS TABLE
-- ==========================================
create table public.pomodoro_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete set null,
  notes text,
  work_duration integer not null, -- in minutes
  break_duration integer, -- in minutes
  interruptions integer default 0,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add a generated column for analytics if needed, or handle in view
-- Note: Your analytics code calculates duration via (ended_at - started_at)

-- Enable RLS
alter table public.pomodoro_sessions enable row level security;

-- Policies
create policy "Users can manage their own pomodoro sessions" 
  on public.pomodoro_sessions for all using (auth.uid() = user_id);


-- ==========================================
-- 7. STUDY LOGS TABLE
-- ==========================================
create table public.study_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete set null,
  title text not null,
  notes text,
  duration integer not null, -- in minutes (for manual entry)
  date timestamp with time zone not null, -- The Log Date
  tags text[] default '{}', -- Array of strings for tags
  
  -- Fields for Analytics calculation compatibility
  started_at timestamp with time zone, 
  ended_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.study_logs enable row level security;

-- Policies
create policy "Users can manage their own study logs" 
  on public.study_logs for all using (auth.uid() = user_id);


-- ==========================================
-- 8. INDEXES (Optimization)
-- ==========================================
create index idx_courses_user on public.courses(user_id);
create index idx_roadmaps_user on public.roadmaps(user_id);
create index idx_tasks_user on public.tasks(user_id);
create index idx_tasks_status on public.tasks(status);
create index idx_study_logs_user_date on public.study_logs(user_id, date);
create index idx_pomodoro_user_started on public.pomodoro_sessions(user_id, started_at);

-- ==========================================
-- 9. OPTIONAL: Analytics Helper Trigger
-- ==========================================
-- Automatically populates started_at/ended_at for Manual Study Logs
-- so the Analytics charts (which use started_at) work correctly.

CREATE OR REPLACE FUNCTION sync_study_log_times()
RETURNS TRIGGER AS $$
BEGIN
  -- If started_at is null but we have a date, set started_at to the date
  IF NEW.started_at IS NULL THEN
    NEW.started_at := NEW.date;
  END IF;
  
  -- If ended_at is null but we have duration, calc ended_at
  IF NEW.ended_at IS NULL AND NEW.duration IS NOT NULL THEN
    NEW.ended_at := NEW.started_at + (NEW.duration || ' minutes')::interval;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_study_log_times
BEFORE INSERT OR UPDATE ON public.study_logs
FOR EACH ROW EXECUTE FUNCTION sync_study_log_times();