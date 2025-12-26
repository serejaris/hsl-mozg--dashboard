## Fix `/workshops` infinite fetch loop

- [ ] Reproduce the bug shown in the screenshot: visit `http://localhost:3000/workshops`, open DevTools → Network, confirm that `/api/courses`, `/api/course-streams`, and `/api/bookings?limit=50` keep firing until Chrome reports `net::ERR_INSUFFICIENT_RESOURCES`.
- [ ] Memoize the data-loading task in `app/workshops/page.tsx` (e.g. wrap it in `useCallback` or move it outside the component) so `useRefreshableData` receives a stable reference; otherwise its internal `useEffect` sees a new `refresh` dependency every render and re-triggers immediately, causing the request storm.
- [ ] Consider hardening `hooks/useRefreshableData.ts` by adding its own dependency array parameter or by memoizing the `refresh` callback with `useRef`, ensuring consumers can't accidentally create loops.
- [ ] Verify only one batch of requests fires on mount and clicking “Обновить” issues a single `Promise.all` (no pending queue growth, no console errors). Document the manual test in the PR notes.
