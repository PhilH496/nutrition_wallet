-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Nutrition facts table for storing scanned nutrition information
CREATE TABLE IF NOT EXISTS public.nutrition_facts (
    nutrition_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    food_name TEXT,
    serving_size NUMERIC,
    serving_unit TEXT,
    calories NUMERIC,
    protein NUMERIC,
    carbs NUMERIC,
    sugars NUMERIC,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User nutrition log table for tracking consumption
CREATE TABLE IF NOT EXISTS public.user_nutrition_log (
    log_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nutrition_fact_id UUID NOT NULL REFERENCES public.nutrition_facts(nutrition_id) ON DELETE CASCADE,
    consumed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security for nutrition_facts
ALTER TABLE public.nutrition_facts ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can read nutrition facts (public data)
CREATE POLICY "Enable read access for all users" 
    ON public.nutrition_facts FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert for authenticated users" 
    ON public.nutrition_facts FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Enable Row Level Security for user_nutrition_log
ALTER TABLE public.user_nutrition_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own logs
CREATE POLICY "Enable read access for own logs" 
    ON public.user_nutrition_log FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Enable insert for own logs" 
    ON public.user_nutrition_log FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for own logs" 
    ON public.user_nutrition_log FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable delete for own logs" 
    ON public.user_nutrition_log FOR DELETE 
    USING (user_id = auth.uid());

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_nutrition_facts_food_name ON public.nutrition_facts(food_name);
CREATE INDEX IF NOT EXISTS idx_user_nutrition_log_user_id ON public.user_nutrition_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_nutrition_log_consumed_at ON public.user_nutrition_log(consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_nutrition_log_nutrition_fact_id ON public.user_nutrition_log(nutrition_fact_id);