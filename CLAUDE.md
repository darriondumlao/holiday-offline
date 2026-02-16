# Project Rules

## Architecture Documentation

This project has an `ARCHITECTURE.md` file that documents how the entire codebase works — every component, API route, data flow, and design decision.

**Rule: Keep ARCHITECTURE.md up to date with every change.**

When making changes to this codebase:

1. **Before committing or pushing**, update `ARCHITECTURE.md` to reflect what changed:
   - If a component was added, removed, or significantly modified — update its description in the relevant section
   - If a new file was created — add it to the File Reference section
   - If a file was deleted — remove it from the File Reference section
   - If data flow, props, or component relationships changed — update the architecture diagrams and descriptions
   - If new environment variables were added — update the Environment Variables table
   - If API routes were added or changed — update the API Routes table

2. **Add a changelog entry** at the bottom of `ARCHITECTURE.md` in the Changelog section with:
   - Date
   - Brief description of what changed
   - Which files were affected

3. **Keep it concise** — the doc should be scannable. Don't over-explain, just keep descriptions accurate and current.

## Code Style

- Tailwind CSS v4 for all styling (responsive with `md:` breakpoints)
- All components are client components (`'use client'`)
- No unused console.log statements in production code
- Next.js `<Image>` with `fill` must always include a `sizes` prop
