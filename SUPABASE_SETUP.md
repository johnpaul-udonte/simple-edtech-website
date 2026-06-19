# Jlux Academy Supabase Setup Guide

This guide explains how to connect the Jlux Academy React/Vite LMS frontend to Supabase.

## 1. Create Supabase Project

1. Go to Supabase.
2. Create a new project.
3. Use the project name: `jlux-academy-lms`.
4. Save the database password somewhere safe.
5. Wait for the project to finish creating.

## 2. Get Supabase Credentials

Go to:

Project Settings → API

Copy:

- Project URL
- anon public key

Do not use the service role key in the frontend.

## 3. Configure Local Environment

Create a `.env.local` file in the project root.

Use this structure:

```env
VITE_SUPABASE_URL=your_real_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_real_supabase_anon_key