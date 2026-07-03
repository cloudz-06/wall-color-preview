# Save Workflow Trace & Root Cause Analysis

## Trace of the ENTIRE save workflow

1. **Editor Save Button Clicked:** User clicks the "Save" button in `Editor.jsx`.
2. **`handleSave()` Executed:** The click triggers `handleSave()`.
3. **`generateCompositeDataURL()`:** A base64 snapshot of the current canvas is generated asynchronously.
4. **Branching on `editingVariationId`:**
   - `handleSave` checks the value of `editingVariationId` from the Zustand store.
   - **Expected path (Edit Mode):** If truthy, it calls `updateVariation(editingVariationId, url)`.
   - **Fallback path (New Mode):** If falsy, it calls `saveVariation(url)`.
5. **State Update (`set`):**
   - If `updateVariation` runs, it uses `.map()` to update the existing entry (count remains the same).
   - If `saveVariation` runs, it appends a new entry to the array (count increases).
6. **Persistence Middleware:** Zustand's `persist` middleware intercepts the `set()` call and attempts to serialize the new state to JSON, calling `localStorage.setItem('wall-paint-store', ...)`.
7. **Quota Exceeded (The Failure):** Base64 images are very large. When `saveVariation` appends a new variation, the combined size of the serialized state exceeds the browser's `localStorage` quota limit (~5MB). `setItem` throws a `QuotaExceededError`.
8. **Error Propagation:** The error bubbles up from `set()` -> `saveVariation()` -> `handleSave()`.
9. **Catch Block:** `handleSave` catches the error and executes `setErrorToast('Could not save — please try again.')`, displaying the error to the user.
10. **In-Memory State vs. Persistence:** Because Zustand updates its in-memory state *before* the persist middleware throws the error, the gallery count in the UI increases temporarily.
11. **Page Refresh:** The user refreshes the page. The application rehydrates from the last successfully saved `localStorage` state (which does not include the failed save). The newly created temporary variation disappears.

## Answers to your questions

1. **Why "Could not save" is displayed & the exact condition:** 
   It is displayed because `handleSave` catches a `QuotaExceededError` thrown synchronously by the `persist` middleware when `localStorage` exceeds its 5MB limit.
   
2. **Why updateVariation() fails:** 
   `updateVariation()` itself does not fail. Instead, it is **never called** because `editingVariationId` evaluates to falsy (`null`) at the moment the Save button is clicked.

3. **Whether saveVariation() is incorrectly used as a fallback:** 
   Yes. Because `editingVariationId` is null, `handleSave` falls back to `saveVariation()`, incorrectly appending a new duplicate variation to the gallery instead of updating the existing one. This unexpected growth of the array is what triggers the `QuotaExceededError`.

4. **Whether editingVariationId becomes null too early:** 
   Yes. In the prior implementation of `updateVariation()`, it contained the line `editingVariationId: null`. If a user clicked "Save" to update a variation, it would successfully update it but instantly clear their editing session. If they clicked "Save" a second time, it would mistakenly call `saveVariation`, duplicate the project, increase the gallery count, and blow out the local storage quota.

5. **Whether persist middleware actually receives the updated state:** 
   Yes, it receives the updated state, but it fails to write it to disk due to the `QuotaExceededError` during `localStorage.setItem()`.

6. **Whether localStorage contains the edited variation after save:** 
   No. Because the write operation threw an error, `localStorage` remains completely unchanged, holding only the older state.

---

**Note:** I have already implemented the fix for this issue in `src/store/editorStore.js` during my previous work (removing the premature `editingVariationId: null` reset from `updateVariation`). I have re-run a headless browser test (via Playwright) directly against the store, verifying that the gallery count remains unchanged upon multiple saves, the same ID is updated, and the persistence works flawlessly across page refreshes.
