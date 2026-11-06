# StudentMarket

A campus marketplace for CPUT students: buy and sell textbooks, tech, res essentials and more, chat with sellers, and order official campus merch.

## Run it locally
    cd frontend
    python3 -m http.server 5500
Open http://localhost:5500

## Connect Supabase (go live)
1. Supabase dashboard -> **SQL Editor** -> paste all of supabase/schema.sql -> **Run** (safe to re-run; it only adds to the existing tables).
2. Project Settings -> API -> copy the **anon / publishable** key into frontend/js/config.js (SUPABASE_ANON_KEY). The URL is already set. Never use the service_role key.
3. Authentication -> URL Configuration: add your Vercel URL (and http://localhost:5500) to the redirect URLs.

Without a key the site runs in **demo mode** (fully working, data saved in the browser only).

## Rules enforced by the database
- Only @mycput.ac.za (students) and @cput.ac.za (staff) emails can register. @cput.ac.za accounts become **admins** automatically.
- Prohibited items (alcohol, drugs/weed, vapes & tobacco, adult/sex items, weapons, prescription meds, fraud, exam answers) are rejected by a trigger. Admins can edit the blocked-word list.
- Restricted accounts can browse and chat but not list. Banned accounts are locked out and their listings are hidden.
- Users can't change their own role or status. Only admins can (via admin_set_role / admin_set_status).

## Admins
Admins land on admin.html: overview, reports queue, all listings (hide/remove), users (make/remove admin, restrict, ban, reinstate) and blocked items.
