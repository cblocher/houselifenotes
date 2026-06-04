# House Life Notes

House Life Notes is a React + TypeScript app for single-family homeowners to track and manage house details, maintenance, and appliances over time.

## Features

- Vite-powered React application
- Supabase-backed authentication and data storage
- House, room, appliance, and exterior management
- Responsive UI with Tailwind CSS

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Supabase

## Prerequisites

- Node.js 20+ installed
- npm (preferred, since this repo includes `package-lock.json`)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with your Supabase values, or copy the included example file:

   ```bash
   cp .env.example .env
   ```

   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   > `.env` is already ignored by Git via `.gitignore`, so it is safe to store local secrets there. Do not commit the real values to source control.

## Contributor checklist

- [ ] Install dependencies: `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Populate `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Run locally with `npm run dev`
- [ ] Lint the code with `npm run lint`
- [ ] Validate types with `npm run typecheck`
- [ ] Build once before deployment with `npm run build`

## Development

Start the development server:

```bash
npm run dev
```

Open the URL shown in the terminal to view the app.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Deployment

This app is a static Vite build and can be hosted on any static site provider, such as:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- Azure Static Web Apps

When deploying, make sure to configure the same Supabase environment variables in the hosting provider settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If your host uses a web UI for environment variables, do not commit production secrets to source control.

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and public anon key into `.env`.
3. Enable email/password auth if you want sign-in flows to work.
4. Add your app origin to Supabase CORS settings (for local development, add `http://localhost:5173`).
5. Review the database migrations in `supabase/migrations` and apply them with Supabase CLI or through the Supabase dashboard.

The app expects Supabase data and auth configuration, so make sure the database schema is initialized before running.

## Supabase migration flow

The migrations in `supabase/migrations` should be applied in timestamp order:

1. `20260109152220_create_home_maintenance_schema.sql`
   - Creates the core schema: `houses`, `rooms`, `interior_appliances`, `appliance_repairs`, `exterior_features`, `property_details`, and `exterior_maintenance`.
   - Enables row-level security (RLS) on these tables.
2. `20260109153920_add_delete_user_account_function.sql`
   - Adds a user-scoped RPC for deleting a user and their associated home data.
3. `20260109155520_add_appliance_purchase_support_attachments.sql`
   - Adds `purchase_location` and `support_link` to `interior_appliances`.
   - Creates `appliance_attachments` for storing files tied to appliances.
4. `20260112140545_add_basement_details_to_rooms.sql`
   - Adds `basement_details` as a JSONB field on `rooms`.
5. `20260112142554_add_garage_details_to_rooms.sql`
   - Adds `garage_details` as a JSONB field on `rooms`.
6. `20260112143100_add_bathroom_details_to_rooms.sql`
   - Adds `bathroom_details` as a JSONB field on `rooms`.
7. `20260112143748_remove_bathroom_details_from_rooms.sql`
   - Removes the `bathroom_details` field from `rooms`.
8. `20260112144441_update_room_count_to_decimal.sql`
   - Converts `rooms.count` from `integer` to `numeric(4,1)` to support half counts.
9. `20260112150006_add_story_style_color_to_property_details.sql`
   - Adds `story`, `build_style`, and `color_type` to `property_details`.
10. `20260112150735_add_house_color_to_property_details.sql`
    - Adds `house_color` to `property_details`.
11. `20260112151025_add_other_text_fields_to_property_details.sql`
    - Adds `story_other`, `build_style_other`, and `color_type_other` to `property_details`.
12. `20260112151120_add_other_text_fields_to_houses_and_rooms.sql`
    - Adds `country_other` to `houses` and `room_type_other` to `rooms`.
13. `20260112151410_add_sewage_type_other_to_property_details.sql`
    - Adds `sewage_type_other` to `property_details`.
14. `20260112151827_add_room_soft_delete_functions.sql`
    - Adds soft-delete, restore, and permanent-delete functions for `rooms`.

> Note: the migration files are written sequentially, so apply them in filename order to keep the schema consistent.
> Review the `delete_user_account` function against the current schema before using it in production. The function now deletes the authenticated user and relies on the current `houses` schema using `ON DELETE CASCADE` to remove related rows automatically.

## Quality checks

- Lint the project:

  ```bash
  npm run lint
  ```

- Run TypeScript type checking:

  ```bash
  npm run typecheck
  ```

## Notes

- `package-lock.json` is already part of this repo, so using `npm` is the safest option for dependency consistency.
- If you choose a different package manager like `pnpm` or `yarn`, the lockfile and install behavior may diverge, which can lead to inconsistent dependency resolution.
