# Cotton Solution - Enterprise Web Portal

Built for **Cotton Solution** (Hasnain Corporation & H.A. Cotton Ginners).

## 🚀 Tech Stack
- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS with Airbnb 3D UI aesthetics (`card-3d`, soft shadows, rounded elements)
- **Icons:** Lucide React (Semi-Realistic 3D styling & clean vectors)
- **Backend & Database:** Supabase (PostgreSQL Database, Auth & Storage for Images, Videos, PDFs)
- **Email Service:** Resend API for OTP and notifications
- **Deployment:** Vercel

## 📂 Project Pages & Features
1. **Home:** Dynamic slideshow managed by admin (Image + Short text + View/Edit/Delete).
2. **Announcements:** Multi-image & video announcements with admin controls.
3. **New Policies:** Corporate policy notices with admin management.
4. **Team Members:** Leadership and partnership roster.
5. **Documents:** 
   - *Download Section:* PDF documents uploaded via admin dashboard.
   - *Generator Section:* Custom document creator with print/PDF export.
6. **Contact Us:** Location, phone, email & inquiry form.
7. **Login / Registration:** Resend OTP email verification and profile updating.
8. **Admin Dashboard:** 
   - User Management (Active, Expired, Banned, Block, Send Notification Alerts)
   - Document Upload (PDF files upload with Name & Detail, plus edit/delete/view)
   - Slides & Announcements Management

## ⚙️ Setup Instructions (Real Supabase Connection)

1. Extract this ZIP file.
2. Install dependencies: `npm install`
3. **Set up the database:**
   - Go to your Supabase project → **SQL Editor** → New Query.
   - Paste the entire contents of `supabase/schema.sql` and run it.
   - This creates all tables, security rules, storage buckets (`media`, `documents`), and an auto-profile trigger.
4. **Add your credentials:**
   - Copy `.env.local.example` to a new file named `.env.local`.
   - Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase → Settings → API Keys (use the **publishable/anon** key only, never the secret key).
5. **Enable email OTP (optional but recommended — Resend as SMTP):**
   - In Supabase → **Authentication → Providers → Email**, make sure "Email OTP" is enabled.
   - In Supabase → **Project Settings → Authentication → SMTP Settings**, add your Resend SMTP credentials so OTP emails are sent via Resend instead of Supabase's limited default sender.
6. **Make yourself an admin:**
   - Run `npm run dev` and register once on the `/login` page with your own email — this creates your profile.
   - Back in Supabase SQL Editor, run:
     ```sql
     update profiles set role = 'admin', status = 'Active' where email = 'your-email@example.com';
     ```
   - Now `/admin/dashboard` will let you in.
7. Run locally: `npm run dev`
8. Upload to **GitHub** and connect your repository to **Vercel** for instant deployment. On Vercel, add the same two `NEXT_PUBLIC_SUPABASE_*` environment variables under Project Settings → Environment Variables.
