# Sortify frontend prototype

A mobile-first Expo / React Native application for identifying everyday waste and finding its next step. The same screens run on iOS, Android, and the web, with a desktop sidebar and compact mobile navigation. The interface builds on the forest-green palette in `src/constants/theme.ts`.

## Run locally

Requires the Node version supported by Expo SDK 57 (22.13 or newer).

```sh
npm install
npm run web
# or, with Expo Go / a development build:
npm run start
```

```sh
npm run typecheck
npm run lint
npm run build:web
```

The web export is written to `dist/`. A static host must resolve paths such as `/scan` to their exported `.html` files. Native camera access should be checked on a physical device; desktop browsers may present a file chooser instead of a camera.

## Walk through the prototype

1. **Overview** — sample discoveries, sorting totals, five waste streams, educational content, and assistant entry points.
2. **Scan an item** — choose or capture an image, or select a sample. Images are validated for size and dimensions. Choose a demo result and select **Identify item · demo**.
3. **Result** — see item, category, sample confidence, preparation steps, safety notes, and selected-area context. Confirm an uncertain match, save the item, mark it sorted, or submit a correction.
4. **Waste guide** — search 15 starter entries, filter by category, and open the same disposal guidance manually. Read the three educational stories.
5. **My history / My activity** — search saved entries, filter sorted/to-sort, remove entries with confirmation, and see counts and a seven-day chart derived from the saved data.
6. **Sortify assistant** — ask about a supported item or enter from a result. The scripted assistant matches catalog keywords, links to guidance, preserves conversations, and offers a fallback for unknown questions.
7. **Settings & profile** — try registration/sign-in validation, edit a local demo profile, sign out, or reset local data.
8. **Admin demo** — add, edit, and delete catalog entries; update disposal and safety guidance; review submitted corrections; inspect usage totals.

Use the header location picker to switch between Patiala, Chandigarh, New Delhi, and another location. Use the scan page’s **Low-confidence result** and **Service unavailable** switches to demonstrate recovery paths.

## Prototype boundaries

- **No live ML or backend calls.** The selected sample determines every demo prediction, even after a photo upload. Confidence values and the analysis delay are simulated.
- **No real authentication or access control.** Both account forms create a local profile. Passwords are neither stored nor verified. The admin preview is intentionally open.
- **No verified location services.** Location changes the displayed context; municipal rules, schedules, and facilities need a verified source before production use.
- **No live conversational AI.** Replies use simple keyword matching against the local guide and are not a substitute for an integrated retrieval service.
- **Local shared storage.** AsyncStorage persists profile, catalog edits, history, feedback, and messages under `sortify-prototype-v1`. Data belongs to the device/browser, not an authenticated account. Guest mode can save history. Photos remain in the picker session and are not stored in history.
- Activity includes clearly identified starter records. No CO₂, weight, classification-accuracy, or other unmeasured impact numbers are invented.
- Reset clears activity/profile and restores the original guide. Deleting an admin catalog item also removes associated history entries, after confirmation; feedback remains reviewable.

## Code map and integration points

| Area | Location | Next integration |
| --- | --- | --- |
| Routes | `src/app/` | Keep navigation and screen URLs stable |
| Shared layout and UI | `src/components/sortify/` | Visual components remain independent of API responses |
| Catalog and types | `src/data/catalog.ts` | Replace starter items with waste-catalog endpoints |
| Local state | `src/state/app-state.tsx` | Replace local actions with authenticated profile/history/feedback APIs |
| Capture and demo prediction | `src/features/scan.tsx` | Send validated image data to FastAPI; handle progress, cancellation, errors, and returned confidence |
| Guidance and corrections | `src/features/result.tsx` | Render server predictions and verified location rules; persist source image references where appropriate |
| Conversation | `src/features/assistant.tsx` | Replace the scripted reply in `send` with the grounded chatbot endpoint |
| Admin | `src/features/admin.tsx` | Add server-enforced roles and catalog/feedback endpoints before exposing real data |

The state module exports `Scan`, `Feedback`, and `Message`; the catalog exports `WasteItem` and `Category`. Keep the recognition service separate from the disposal knowledge base when connecting the backend.
