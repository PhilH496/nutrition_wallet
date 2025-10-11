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

-- Foods table for storing scanned nutrition information
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    serving_size TEXT,
    calories NUMERIC,
    total_fat NUMERIC,
    saturated_fat NUMERIC,
    trans_fat NUMERIC,
    cholesterol NUMERIC,
    sodium NUMERIC,
    total_carbs NUMERIC,
    fiber NUMERIC,
    sugar NUMERIC,
    protein NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security for foods
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own foods
CREATE POLICY "Users can view own foods" 
    ON public.foods FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own foods" 
    ON public.foods FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own foods" 
    ON public.foods FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own foods" 
    ON public.foods FOR DELETE 
    USING (auth.uid() = user_id);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_foods_user_id ON public.foods(user_id);
CREATE INDEX IF NOT EXISTS idx_foods_created_at ON public.foods(created_at DESC);