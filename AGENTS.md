<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Restaurant photos come from Google Places (stored place id + photo names, served via /api/public/place-photo which only serves stored photo names); why: official API, attribution, no open proxy.
- Cursor decoration lives in an isolated, non-interactive canvas component and runs only for fine mouse pointers without reduced motion; why: preserve layout, accessibility, and existing interactions.
- Google reviews are fetched server-side per stored place id and cached in the restaurants table for 30 days; why: bound Google usage, no open proxy.
