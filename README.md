# DueNudge — Phase 1 MVP

> **DueNudge** is an automated invoicing and payment reminder web app built for freelancers to create invoices and send automated late-payment reminders without the awkwardness.

---

## 🚀 Tech Stack

- **Frontend & Backend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Icons & UI Utilities**: Lucide React, `clsx`, `tailwind-merge`
- **Database, Auth & Storage**: Supabase
  - **Supabase Auth**: Passwordless Email Magic Link & Google OAuth
  - **Supabase PostgreSQL**: `users` and `business_profiles` tables with Row-Level Security (RLS)
  - **Supabase Storage**: `business-logos` bucket for freelance business logos

---

## 📦 Project Structure

```text
duenudge/
├── src/
│   ├── app/
│   │   ├── auth/callback/route.ts   # Exchange OAuth & magic link tokens
│   │   ├── invoices/page.tsx        # Phase 2 preview page
│   │   ├── login/page.tsx           # Sign Up & Log In screen
│   │   ├── onboarding/page.tsx      # Freelancer Onboarding screen
│   │   ├── reminders/page.tsx       # Automated reminders preview
│   │   ├── settings/page.tsx        # Business Profile & Invoicing Defaults
│   │   ├── globals.css              # Tailwind CSS styling
│   │   ├── layout.tsx               # Root layout & typography
│   │   └── page.tsx                 # Landing / Overview page
│   ├── components/
│   │   ├── AuthForm.tsx             # Magic link & Google auth form
│   │   ├── BusinessProfileForm.tsx  # Profile settings & live preview card
│   │   ├── Navbar.tsx               # Responsive header navigation & user avatar
│   │   └── SupabaseNotice.tsx       # Configuration banner and setup helper
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Client-side Supabase client (@supabase/ssr)
│   │   │   ├── middleware.ts        # Session refresh helper
│   │   │   └── server.ts            # Server-side Supabase client (@supabase/ssr)
│   │   └── utils.ts                 # Supported currencies, timezones, cn helper
│   ├── middleware.ts                # Next.js request auth refresher
│   └── types/
│       └── database.ts              # TypeScript definitions for Supabase schema
├── supabase/
│   └── schema.sql                   # Complete SQL migrations, RLS & Storage policies
├── .env.example                     # Environment template
└── .env.local                       # Local environment variables
```

---

## ⚡ Quick Start

### 1. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase project dashboard.
3. Open `supabase/schema.sql` from this repository, paste its contents into the SQL Editor, and click **Run**.
   - This creates the `public.users` and `public.business_profiles` tables.
   - Enables Row-Level Security (RLS) with SELECT/INSERT/UPDATE policies bound to `auth.uid()`.
   - Creates the `handle_new_user()` trigger to automatically create profiles on user signup.
   - Creates the `business-logos` Supabase storage bucket with public read and authenticated write access.
4. (Optional) In **Authentication → Providers**:
   - Enable **Email** (Magic Link is enabled by default).
   - If using **Google**, enable the Google provider with your Google Cloud Client ID and Secret, and set the Redirect URL to:
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```

### 2. Set Environment Variables

Create `.env.local` (or copy from `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Core Requirements Implemented (Phase 1)

1. **Authentication**:
   - **Email Magic Link**: Freelancers enter their email and receive a secure sign-in link in their inbox.
   - **Google OAuth**: Instant single-click authentication using Supabase Auth.
   - **Session Callback**: `/auth/callback` handles token exchange and redirects users to onboarding/settings.
   - **Sign Out**: Clean logout handling that invalidates session cookies and redirects to `/login`.
   - **Demo / Preview Mode**: Allows testing all UI components even before connecting live Supabase keys.

2. **Database Schema & Row-Level Security (RLS)**:
   - `users`: `id` (references `auth.users`), `email`, `full_name`, `avatar_url`, timestamps.
   - `business_profiles`:
     - `user_id`: UUID foreign key to `auth.users(id)` with unique constraint.
     - `business_name`: Text name of business / studio.
     - `logo_url`: High-resolution logo URL in Supabase Storage.
     - `address`: Street address / tax residency for invoice headers.
     - `currency`: Default currency (`USD`, `EUR`, `GBP`, `CAD`, `AUD`, `INR`, etc.).
     - `payment_instructions`: Bank wire, IBAN, PayPal link, or Stripe payment link.
     - `default_due_days`: Payment terms (e.g. 14 days).
     - `invoice_prefix`: Invoice numbering prefix (e.g. `INV-`).
     - `timezone`: Timezone for reminder delivery schedule (e.g. `America/New_York`, `UTC`, `Asia/Kolkata`).
   - RLS strictly ensures that users can only select, insert, or update their own data (`auth.uid() = user_id`).

3. **Logo Upload & Supabase Storage**:
   - File picker supporting PNG, JPEG, SVG, and WebP (up to 5MB).
   - Live thumbnail preview with one-click change or removal.
   - Direct upload to the `business-logos` Supabase storage bucket under the user's namespace.

4. **UI & User Experience**:
   - Built with Next.js App Router and responsive Tailwind CSS.
   - **Live Client Preview Card**: Real-time side-by-side preview showing:
     - The generated invoice header with logo, address, and due dates.
     - The exact polite automated late-payment email that DueNudge will send to the client.
   - Pre-populated payment instruction templates (Bank Wire, PayPal, Stripe Link).
   - Fast presets for payment due days (7, 14, 21, 30, 45, 60 days).
