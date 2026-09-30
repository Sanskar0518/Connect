-- Connect: Supabase SQL Migration for Gemini Resume Screening & Extraction
-- Run this in your Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard/project/tkfgiqnjsitbfvbamplc/sql)

-- 1. Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT,
    json_report_url TEXT,
    file_size INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Resume Screenings Table
CREATE TABLE IF NOT EXISTS public.resume_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    candidate_name TEXT,
    candidate_email TEXT,
    candidate_phone TEXT,
    candidate_location TEXT,
    candidate_summary TEXT,
    ats_score NUMERIC(5,2) DEFAULT 0,
    match_level TEXT,
    target_role TEXT,
    summary TEXT,
    strengths JSONB DEFAULT '[]'::jsonb,
    critical_gaps JSONB DEFAULT '[]'::jsonb,
    missing_keywords JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '{}'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    rewrites JSONB DEFAULT '[]'::jsonb,
    raw_screening JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_screenings ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'resumes' AND policyname = 'Allow select for all'
    ) THEN
        CREATE POLICY "Allow select for all" ON public.resumes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'resumes' AND policyname = 'Allow all for service role'
    ) THEN
        CREATE POLICY "Allow all for service role" ON public.resumes USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'resume_screenings' AND policyname = 'Allow select for all screenings'
    ) THEN
        CREATE POLICY "Allow select for all screenings" ON public.resume_screenings FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'resume_screenings' AND policyname = 'Allow all for service role screenings'
    ) THEN
        CREATE POLICY "Allow all for service role screenings" ON public.resume_screenings USING (true) WITH CHECK (true);
    END IF;
END
$$;
