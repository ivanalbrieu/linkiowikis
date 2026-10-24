# LinkioWikis
## Project Guide, Architecture, and Innovation Roadmap

### 1. Project Overview

**LinkioWikis** is a wiki application built with Node.js, Express, EJS, and Sequelize. Its purpose is to provide a platform for creating, editing, organizing, and discussing wiki content.

The project is being developed on Windows using **Antigravity** as the development client.

The goal is to evolve LinkioWikis into a capable, maintainable wiki platform with a distinctive interface, accessible editing tools, reliable content management, and useful community features.

The project should build on its existing architecture rather than introduce unnecessary complexity.

---

### 2. Current Technology Stack

| Component | Technology | Status |
|---|---|---|
| Runtime | Node.js | Existing |
| Web framework | Express.js | Existing |
| Templates | EJS | Existing |
| Database ORM | Sequelize | Existing |
| Authentication | Passport | Existing |
| Password hashing | bcryptjs | Existing |
| Frontend styling | Tailwind CSS | Current; replaces Bootstrap |
| Development client | Antigravity | Current |
| Database | Sequelize-supported database (MySQL via XAMPP) | Existing |
| Email | Nodemailer with Mailtrap sandbox for development testing | Previously configured |
| Caching | node-cache | Implemented for page-count caching |
| Wiki content format | Pure standard Markdown with `[[WikiLinks]]` | Active / Confirmed |
| Wiki editor | Textarea editor (upgrades planned) | Existing |

**Important changes:**
- Bootstrap has been replaced with Tailwind CSS.
- The wiki no longer uses wikitext.
- The previous wikitext parser and wikitext-to-Markdown conversion approach are outdated.
- Pure Markdown is the confirmed format (rendered via `marked` with `[[Page Title]]` internal existence checks).

---

### 3. Existing Project Architecture

The application uses a conventional Express structure, with routes, models, templates, configuration, and middleware separated into different files.

- `app.js` — Express application configuration and middleware.
- `routes/` — Request handling, including wiki, revisions, editor, and authentication routes.
- `config/cache.js` — Shared cache configuration (`node-cache`).
- `models/` — Sequelize database models (`Page`, `Revision`, `Category`, `User`, etc.).
- `wiki/` — EJS templates rendered by the server.
- `src/input.css` & `public/css/tailwind.css` — Tailwind styling pipeline.
- `utils/markdown-wiki.js` — Markdown rendering and internal wiki link processor.

The development directory is:
`D:\dev\linkiowikis\testwiki`

#### Architectural Principles
1. Keep route handlers, database operations, and presentation logic appropriately separated.
2. Reuse shared configuration instead of creating duplicate instances.
3. Use existing models and middleware when they already solve the problem.
4. Preserve compatibility with the current database schema.
5. Avoid unnecessary migrations, dependencies, or framework replacements.
6. Make changes incrementally and verify them before moving to another feature.

---

### 4. Wiki Content and Editing

The wiki no longer uses wikitext. Consequently, its editing and rendering system is based strictly on pure Markdown.

#### Reading pages
A wiki page supports:
- Clear titles and readable body content.
- Headings and structured sections.
- Internal links to other wiki pages (`[[Page Title]]` or `[[Page Title|Display Text]]`).
- External links (automatically appending external-link icon).
- Images and other supported media.
- Tables and lists where supported by standard Markdown.
- Responsive layouts on desktop and mobile.
- Clear handling of nonexistent pages (red links) and redirects.

#### Editing pages
The editing experience aims to provide:
- A clear editing interface.
- A preview of the rendered result.
- Detection of mistakes before saving.
- Useful validation and error messages.
- Protection against losing unsaved work.
- A consistent experience when creating and editing pages.

#### Rendering and security
- Escape untrusted text where appropriate.
- Sanitize HTML if users can supply raw HTML.
- Prevent cross-site scripting (XSS).
- Validate URLs and link destinations.
- Avoid executing user-supplied scripts.
- Handle malformed content without crashing the application.

---

### 5. Authentication and Account Management

Technologies include Passport, bcryptjs, JWT, Nodemailer, and Express middleware.

#### Password reset
- Form for requesting a password reset.
- Token-based reset URL.
- Form for choosing a new password.
- Email delivery through Nodemailer.
- Secure, expiring reset tokens with server-side validation.
- Safe password hashing.
- Generic responses that do not reveal whether an account exists.
- Secrets stored in environment variables (`.env`).

---

### 6. Wiki Page Management

#### Page creation and editing
- Warn users when a page with the same title already exists.
- Detect accidental empty submissions.
- Provide a useful edit summary.
- Warn before leaving with unsaved changes.
- Display the last modification time and editor where appropriate.

#### Page deletion
- Only authorized users can delete pages.
- Errors handled safely; relevant caches invalidated.
- Deletion confirmation dialog.

#### Revisions and history
- Chronological revision list.
- Editor and timestamp for each revision.
- Edit summaries/justifications.
- Comparison between revisions (word-level diff).
- Restoration of previous revisions.

#### Redirects
- Clearly identifying redirects.
- Preventing redirect loops and broken destinations.
- Excluding redirect pages from counts of content pages.

---

### 7. Page Counting and Caching

Maintain a page count that excludes redirect pages using a shared `node-cache` instance (`nonRedirectPageCount`).
- Define content page criteria cleanly.
- Invalidate cache consistently across all mutations (`myCache.del('nonRedirectPageCount')`).
- Avoid stale values after creation, move, or deletion.

---

### 8. Community Features

- User profiles and contribution statistics.
- Message walls and discussion areas.
- Independent Markdown parsing pipeline for discussions.
- Scoped moderation tools for wiki owners and admins.

---

# PART II — Innovation Roadmap

### 9. Innovation Principle: Make the Wiki Easier to Use
Solve recognizable problems instead of adding complexity.

### 10. Smarter Search and Discovery (Priority: High)
- **Search suggestions:** Real-time dropdown while typing.
- **Search results:** Title matches, body excerpts, term highlighting.
- **Related pages:** Backlinks, related articles, orphaned page detection.

### 11. A Better Page-Editing Experience
- Live preview toggle / split-pane editor.
- Autosave drafts (client-side localStorage or draft table).
- Unsaved change warnings (`beforeunload`).
- Keyboard shortcuts.

### 12. Page Quality and Maintenance Tools
- Maintenance dashboard for broken links, dead redirects, orphaned pages, and stubs.

### 13. Revision Comparison
- Enhanced side-by-side / inline visual diffs with rollback capabilities.

### 14. Better Internal Linking & Backlinks
- Backlink queries: "What links here?".
- Autocompleting `[[` wiki-link syntax in the editor.

### 15. User Profiles and Contribution History
- Transparent, activity-calculated contribution history and statistics.

### 16. Community Moderation & Master Admin (Wikidot Model)
- Decentralized governance: Wiki Owner / Master Admin role.
- RBAC: Owner -> Admin -> Moderator -> Editor -> Reader.
- Audit logging for moderation actions.

### 17. Accessibility and Responsive Design
- Semantic HTML, visible keyboard focus, color contrast, and fully responsive layouts.

### 18. Performance and Reliability
- Indexed queries, pagination, centralized cache invalidation, and resilient error handlers.

### 19. Security as a Core Feature
- Server-side authorization on every action, HTML sanitization, CSRF protection, and rate limiting.

### 20. Possible Future Innovations
- Page relationship graph explorer.
- Smart article assistance.
- Content templates.
- Draft workspace.
- Standalone MediaWiki XML dump to Neowiki CSV converter.

---

# PART III — Development Workflow

### 21. Working with Antigravity
1. Inspect existing code first.
2. Identify responsible route, model, middleware, or template.
3. Make the smallest coherent implementation.
4. Reuse existing conventions and dependencies.
5. Verify changes and test for regressions.
6. Commit cleanly with descriptive summaries.

### 22. Tailwind CSS Rules
- All new styling must use Tailwind CSS.
- Zero Bootstrap markup or grid classes.
- Compile with `npm run build:css`.

### 23. Database and Migration Rules
- Preserve existing schema and data.
- Do not assume models auto-migrate without verification.

---

# PART IV — Recommended Roadmap

- **Phase 1: Establish Current Baseline** (Completed: Tailwind migration, 11 templates scaled, pure Markdown engine active).
- **Phase 2: Stabilize Core Functionality** (Page CRUD, Page/Revision Restoration, Flush Service & Account Disable active).
- **Phase 3: Everyday User Experience** (Editor enhancements, live preview, search suggestions, backlink discovery).
- **Phase 4: Maintenance & Collaboration** (Revision rollbacks, broken-link detector, Master Admin controls).
- **Phase 5: Distinctive Innovations** (Neowiki CSV dump pipeline, graph explorer, quality checker).

---

# PART V — Rules for Future Development

1. **Antigravity is the development client.**
2. **Tailwind CSS replaces Bootstrap.**
3. **The wiki no longer uses wikitext.**
4. Do not reintroduce the old wikitext parser or conversion pipeline.
5. Pure standard Markdown is the confirmed format.
6. Inspect existing code before replacing functionality.
7. Prefer simple, understandable implementations.
8. Treat security, accessibility, and reliability as core requirements.
9. Preserve existing user data and working behavior.
