# Evidence for Good — Official Website

Public website for **Evidence for Good (E4G)**, a social impact organisation generating evidence and deploying cost-effective solutions that advance equity and improve lives across Africa.

Live site: [evidenceforgood.org](https://www.evidenceforgood.org)

---

## Pages

| Route | Description |
|---|---|
| `/` | Home (SPA — hero, services, work, blog preview, evidence preview) |
| `/about/` | About us — mission, team, values |
| `/approach/` | Our approach to evidence-based work |
| `/blog/` | Blog — posts loaded from Supabase |
| `/evidence/` | Research & evidence — publications loaded from Supabase |
| `/contact/` | Contact page with enquiry form |
| `/project1/` | Project detail — Maternal Anaemia & AI |
| `/project2/` | Project detail — HIV & TB Funding Cuts |

---

## Tech Stack

- **HTML/CSS/JS** — static multi-page site, no build step
- **Tailwind CSS** — via CDN with custom font config
- **Supabase** — backend for blog posts, comments, and contact messages
- **Chart.js** — data visualisation inside blog/evidence content blocks
- **Google Fonts** — Playfair Display (headings) + Dax (body)

---

## Project Structure

```
/
├── index.html              # Home page (SPA with hash routing)
├── about/index.html
├── approach/index.html
├── blog/index.html
├── evidence/index.html
├── contact/index.html
├── project1/index.html
├── project2/index.html
├── assets/
│   ├── shared.css          # All shared styles and design tokens
│   ├── shared.js           # Shared JS (nav, Supabase client, chart helpers)
│   ├── main.js             # SPA routing and modal logic for index.html
│   ├── blog.js             # Blog post loading and comment logic
│   ├── evidence.js         # Evidence post loading and modal logic
│   └── images/             # All site images and logo
├── config.js               # Supabase credentials (not in git — see below)
├── sitemap.xml
└── robots.txt
```

---

## Supabase Setup

The site connects to a Supabase project for dynamic content. Three tables are required:

### `blog_posts`
Stores blog articles. Expected columns: `id`, `title`, `category`, `date`, `image`, `summary`, `blocks` (JSON), `created_at`.

### `blog_comments`
Stores reader comments on blog posts.
```sql
create table public.blog_comments (
  id         uuid default gen_random_uuid() primary key,
  post_id    uuid not null references public.blog_posts(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 100),
  comment    text not null check (char_length(comment) between 1 and 2000),
  created_at timestamptz default now() not null
);
alter table public.blog_comments enable row level security;
create policy "Public can read comments"  on public.blog_comments for select using (true);
create policy "Public can post comments"  on public.blog_comments for insert with check (true);
```

### `contact_messages`
Stores contact form submissions.
```sql
create table public.contact_messages (
  id         uuid default gen_random_uuid() primary key,
  name       text not null check (char_length(name) between 1 and 100),
  email      text not null check (char_length(email) between 1 and 200),
  message    text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz default now() not null
);
alter table public.contact_messages enable row level security;
create policy "Public can submit contact" on public.contact_messages for insert with check (true);
```

---

## Local Development

No build step required. Use any static file server from the project root so that absolute paths (`/assets/shared.css`, `/config.js`) resolve correctly.

**Option A — VS Code Live Server**
Install the Live Server extension, right-click `index.html` → Open with Live Server.

**Option B — Python**
```bash
python -m http.server 8080
```
Then open `http://localhost:8080`.

---

## Credentials

Create a `config.js` file in the project root (this file is in `.gitignore` and must never be committed):

```js
window.SUPABASE_URL = 'your-supabase-url';
window.SUPABASE_ANON_KEY = 'your-anon-key';
```

---

## SEO

- Meta tags, Open Graph, and Twitter Cards on every page
- JSON-LD structured data (Organization, WebSite, Blog, CollectionPage, ContactPage, BreadcrumbList)
- `sitemap.xml` and `robots.txt` at root
- Canonical URLs on every page
- Submitted to Google Search Console and Bing Webmaster Tools

---

## Contributing

1. Create a branch from `main`
2. Make changes and test locally
3. Open a pull request — do not push directly to `main`
