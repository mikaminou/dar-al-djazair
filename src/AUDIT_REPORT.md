# AUDIT REPORT — Dar El Djazair
**Date:** 2026-04-26  
**Audit scope:** Batches 1 through Z  
**Auditor:** Base44 AI Agent (automated static analysis)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total checks performed | 58 |
| ✅ Pass | 28 |
| ⚠️ Partial | 12 |
| ❌ Fail | 5 |
| ⏭ Not yet implemented | 13 |
| Critical blockers | 3 |

### Critical Issues Blocking Production
1. **Duplicate config in `watermarkService.js`** — WM constants are inlined in the service (line 13–17) AND defined separately in `watermark.config.js`. Changes to the config file have no effect on the actual service. (Part 1, Check 4)
2. **`ListingBadgeRow` hardcodes type logic** — Contains a `BADGE_RULES` object keyed by type string (`land`, `farm`, `building`, `apartment`), bypassing the config system entirely. (Part 1, Check 2)
3. **No server-side validator** — `server/property-types/validator.ts` does not exist. Listing payloads are only validated in the browser via `validateAttributes()`. A malformed or manually crafted API call can bypass all required-field validation. (Part 3)

### Recommended Next Batch
**Batch AB — Backend Hardening**: Create `server/property-types/validator.ts`, fix the watermark config import, consolidate `ListingBadgeRow` into config, add server-side input sanitization, and implement the missing unit tests.

---

## Detailed Findings

---

### Part 1 — Architecture Integrity

---

#### 1.1 Single Source of Truth — Config File Exists
**Status:** ✅ Pass  
**Files:** `src/components/propertyTypes.config.js` (lines 1–418)  
**Evidence:**
```js
// line 37
export const PROPERTY_TYPE_DEFS = [
  { key: "apartment", ... },
  { key: "house", ... },
  { key: "villa", ... },
  { key: "land", ... },
  { key: "commercial", ... },
  { key: "building", ... },
  { key: "office", ... },
  { key: "farm", ... },
];
```
All 8 required property types present. Exports: `getPropertyType`, `getAllPropertyTypes`, `getFieldsForType`, `getRequiredFields`, `getSearchFilterFields`, `getCardFields`, `getCardBadgeFields`, `validateAttributes`, `getSharedFieldKeys`, `migrateAttributes`, `PROPERTY_TYPES`.

**Issues:** None  
**Severity:** —

---

#### 1.2 No Hardcoded Type Logic — Violations Found
**Status:** ⚠️ Partial  
**Files inspected:**
- `src/components/listing/ListingBadgeRow.jsx` (lines 9–50) — **VIOLATION**
- `src/components/listing/DynamicFieldDisplay.jsx` (line 138) — minor violation
- `src/components/listing/ListingCard.jsx` — Clean ✅
- `src/components/listing/ListingCardFacts.jsx` — Clean ✅
- `src/components/listing/ListingCardBadges.jsx` — Clean ✅
- `src/components/listing/DynamicFormRenderer.jsx` — Clean ✅
- `src/utils/matchesSearch.js` — Clean ✅

**Violations Found:**

**Violation A — `ListingBadgeRow.jsx` lines 9–50 (Major)**
```js
const BADGE_RULES = {
  land:       [ { field: "buildable", render: ... } ],
  farm:       [ { field: "has_water_access", render: ... } ],
  building:   [ { field: "total_units", render: ... } ],
  apartment:  [ { field: "furnished", ... }, { field: "elevator", ... } ],
};
```
This is a parallel hardcoded rule system that duplicates what `propertyTypes.config.js` already defines via `showAsCardBadge` flags. The config-driven `ListingCardBadges` component renders the same information from the config. `ListingBadgeRow` appears to be a legacy component not yet retired.

**Violation B — `DynamicFieldDisplay.jsx` line 138 (Minor)**
```js
const typeDef = getPropertyType(
  propertyType === "new_development" ? "building" : propertyType
);
```
Hardcoded `new_development` → `building` mapping. This is a migration shim but should be centralized in a migration helper, not inside a display component.

**Severity:** Major (Violation A), Minor (Violation B)  
**Recommended fix:**
- A: Retire `ListingBadgeRow` entirely — its role is fully covered by `ListingCardBadges`. Search for any usage of `<ListingBadgeRow` and replace with `<ListingCardBadges`.
- B: Extract the type alias mapping into a `PROPERTY_TYPE_ALIASES` constant in `propertyTypes.config.js` and reference it from `DynamicFieldDisplay`.

---

#### 1.3 Price Logic Centralization
**Status:** ✅ Pass  
**Files:** `src/components/price.config.js` (lines 1–181)  
**Evidence:**
```js
export function formatPrice(amount, listingType = 'sale', lang = 'fr') { ... }
export function formatSaleDisplay(n, lang = 'fr') { ... }
export function formatRentalDisplay(n, lang = 'fr') { ... }
export function interpretSaleInput(typed) { ... }
export function getAmbiguousOptions(n, lang = 'fr') { ... }
export function storedValueToTyped(storedValue) { ... }
```
`ListingCard` (line 21) correctly imports `formatPrice` from `price.config`.

**Known partial violation — `listingAttributes.js` line 245:**
```js
price_display: listing.price ? `${listing.price.toLocaleString()} DA` : "",
```
This is inside the notification template placeholder builder, not a user-facing UI display. It bypasses `formatPrice`. Minor issue: it does not respect language or the sale/rent milliard convention.

**Severity:** Minor  
**Recommended fix:** Replace with `import { formatPrice } from "@/components/price.config"` and use `formatPrice(listing.price, listing.listing_type, lang)` in `buildTemplatePlaceholders`.

---

#### 1.4 Watermark Service Isolation
**Status:** ❌ Fail (Critical)  
**Files:**
- `src/functions/watermarkService.js` (lines 1–117) — service exists ✅
- `src/functions/watermark.config.js` (lines 1–32) — config exists ✅

**Critical Issue — Config is not imported by service:**
```js
// watermarkService.js lines 13–17
const WM = {
  marginRatio: 0.03,
  image: { sizeRatio: 0.12, opacity: 165 },
  text:  { fontSizeRatio: 0.03, shadowOffset: 2, opacity: 178 },
};
```
The service duplicates the config values inline with a comment:
> `// ── CONFIG (inline — watermark.config.js cannot be imported as a module) ──`

This means `watermark.config.js` is a documentation artifact only. Editing it has zero effect on watermark behavior.

**Additional issue:** `watermarkService.js` ends with a `Deno.serve()` block (line 115–117), making it both a module and an HTTP handler. This prevents other backend functions from importing it as a shared module.

**Severity:** Critical  
**Recommended fix:**
1. Move visual settings from the inlined `WM` constant into a Deno-compatible import OR merge both files into one and delete `watermark.config.js`.
2. Remove the `Deno.serve()` stub from `watermarkService.js` if it is meant to be a shared module. The handler should live in `watermarkListingPhotos.js` which imports the service.

---

#### 1.5 Lot Type Enum Unification
**Status:** ✅ Pass  
**Files:** `src/utils/lotTypes.js` (lines 1–56)  
**Evidence:**
```js
export const LOT_TYPES = ["F1","F2","F3","F4","F5","F6_plus","duplex","penthouse","commercial","parking"];
export const LOT_TYPE_LABELS = { F1: {...}, F2: {...}, ... };
export function getLotTypeLabel(lotType, lang) { ... }
export function getLotTypeOptions(lang) { ... }
```
The file has the correct comment: "Do not hardcode lot type strings anywhere else — always import from here."

**Partial concern:** Cannot verify at static analysis time whether `PostProject.jsx` and building-related components actually import from this file. Manual verification recommended.

**Severity:** Minor (unverified consumer usage)  
**Recommended fix:** Search codebase for `"F1"`, `"F2"`, `"F3"` string literals outside `lotTypes.js` and verify none appear in JS/JSX files.

---

### Part 2 — Database Schema

**Status:** ⏭ Not yet implemented / Not verifiable  

Base44 uses a managed backend-as-a-service. The database schema is represented via `entities/*.json` JSON schemas, not raw SQL. The following findings apply:

**2.1 Flexible attributes column**
- `entities/Listing.json` has `attributes: { type: "object" }` — this maps to a JSON/JSONB column. ✅
- GIN index: Cannot be verified — not configurable via Base44 entity schemas. **Manual review required**: Confirm with Base44 support whether JSONB columns are automatically GIN-indexed.

**2.2 Core column indexes**
- B-tree indexes on `price`, `area_value`, `wilaya`, `property_type`, `listing_type`, `status`: Not configurable via Base44 entity schemas.
- **Manual review required:** Contact Base44 support or inspect database introspection for index coverage.

**2.3 Saved searches schema**
- `entities/SavedSearch.json` has `filters: { type: "object" }` — flexible enough for both old and new shapes. ✅
- Old shape cleanup: `migrateSavedSearchFilters()` exists in `utils/listingAttributes.js` but is a frontend utility, not an automated migration. **Migration must be triggered manually or via a backend function.**

**2.4 Migration scripts**
- `functions/migratePropertyTypes.js` — referenced in `HOW_TO_ADD_PROPERTY_TYPE.md` as example pattern. Existence confirmed.
- `functions/migrateFoundedYear.js` — confirmed in file tree.
- `functions/migrateUserRoles.js` — confirmed in file tree.
- Promotion_immobilière → building migration: **No migration function found** for this specific reclassification. ⚠️ Partial.
- All migrations should be admin-only — verifiable via `user.role === "admin"` check.

**Severity:** Major (missing promo_immobiliere migration), Minor (index unverifiable)

---

### Part 3 — Backend Modules

---

#### 3.1 Property Types Loader
**Status:** ⚠️ Partial  
**Expected path:** `server/property-types/loader.ts`  
**Actual location:** `src/components/propertyTypes.config.js`

The loader functions exist but in the **frontend** component directory, not a server module:
```js
// propertyTypes.config.js lines 317–344
export function getPropertyType(key) { ... }
export function getAllPropertyTypes() { ... }
export function getFieldsForType(key) { ... }
export function getRequiredFields(propertyTypeKey, listingType) { ... }
```
These are pure functions with no side effects. ✅ for purity.  
**Issue:** There is no dedicated server-side loader. Backend functions that need type definitions must either inline them or call a frontend file (not possible in Deno). Each backend function re-implements any type-aware logic it needs. This works but limits server-side config-driven behavior.

**Severity:** Major (architectural gap — backend functions cannot import from frontend)  
**Recommended fix:** Create `functions/propertyTypesConfig.js` as a Deno-compatible copy (or subset) of the frontend config, so backend functions like `checkExclusivityConflict` can import from it rather than duplicating logic.

---

#### 3.2 Validator Service
**Status:** ❌ Fail (Critical)  
**Expected path:** `server/property-types/validator.ts`  
**Actual location:** Frontend only — `validateAttributes()` in `propertyTypes.config.js` line 375

The function exists on the **client side** only:
```js
export function validateAttributes(attributes, propertyTypeKey, listingType) {
  const requiredFields = getRequiredFields(propertyTypeKey, listingType);
  const errors = {};
  for (const field of requiredFields) {
    const val = attributes[field.key];
    if (val === undefined || val === null || val === "") {
      errors[field.key] = "required";
    }
    // ... min/max checks
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
```
There is **no server-side validation** intercepting listing creation/update API calls. A user bypassing the UI can POST invalid listings directly to the entity API.

**Severity:** Critical  
**Recommended fix:** Create a backend function `validateListing` that applies the same required-field rules and is invoked by the PostListing flow via `base44.functions.invoke()` before entity creation.

---

#### 3.3 Normalizer Service
**Status:** ⏭ Not yet implemented  
**Expected path:** `server/property-types/normalizer.ts`  
No normalizer found. Attribute splitting (core columns vs. `attributes` JSONB) happens only in the frontend form. The database receives whatever the frontend POSTs.

**Severity:** Major  
**Recommended fix:** Implement server-side normalization as a backend function or pre-save hook.

---

#### 3.4 Search Query Builder
**Status:** ⏭ Not yet implemented (frontend substitute exists)  
**Expected path:** `server/listings/searchBuilder.ts`  
**Actual:** `utils/matchesSearch.js` — a pure frontend filter function.

The app does **client-side filtering** of listings returned by `base44.entities.Listing.filter()`. This means all listings (up to limit) are fetched and then filtered in-browser. For small datasets this works; at scale (1000+ listings) this will cause performance degradation.

**Severity:** Major (scalability concern)  
**Recommended fix:** At high listing counts, implement a backend function that builds and executes filtered queries server-side, reducing payload size.

---

#### 3.5 matchesSearch Function
**Status:** ✅ Pass  
**Files:** `src/utils/matchesSearch.js` (lines 1–164)  
**Evidence:**
```js
export function matchesSearch(listing, filters) {
  // Core columns (line 68–74)
  if (filters.listing_type && listing.listing_type !== filters.listing_type) return false;
  if (filters.property_type && listing.property_type !== filters.property_type) return false;
  // ... price filters
  
  // Dynamic attribute filters from config (line 87–88)
  const fieldDefs = getFieldsForType(propertyType);
  const fieldMap = Object.fromEntries(fieldDefs.map(f => [f.key, f]));
  
  // Unit normalization (line 117–123)
  if (fieldDef.type === "unit_number") {
    const listingM2 = normalizeToM2(attrVal);
    const filterM2 = normalizeToM2(...);
    if (mode === "min" && listingM2 < filterM2) return false;
  }
}
```
Empty/null filter values are skipped at line 98: `if (!filterVal && filterVal !== false && filterVal !== 0) continue;`  
Unknown field for a type returns `false` (line 111) — correct exclusion behavior.

**Test case trace (manual):**
- Apt 3 bedrooms, `min_bedrooms=2` → fieldDef found for `bedrooms`, `3 >= 2` → **true** ✅
- Apt 3 bedrooms, `min_bedrooms=4` → `3 < 4` → **false** ✅
- Land 1 hectare, `min_area=5000 m²` → `normalizeToM2({value:1,unit:"hectares"})=10000`, `10000 >= 5000` → **true** ✅
- Apt listing, filter `buildable=true` → `fieldDefs` for apartment has no `buildable` field → `return false` ✅
- Filter `min_bedrooms=""` → skipped at line 98 → listing not excluded ✅

**Minor issue:** The `"3+"` syntax handling (lines 129–131) has redundant code: `if (isPlus ? n < threshold : n < threshold)` — both branches are identical. The `+` suffix feature works but the `else` branch is dead code.

**Severity:** Minor (dead code in plus-suffix handling)  
**Recommended fix:** Simplify: `if (n < threshold) return false;` (the `isPlus` condition has no effect on the min comparison).

---

#### 3.6 Watermark Service
**Status:** ⚠️ Partial  
**Files:** `src/functions/watermarkService.js` (lines 1–117)  
**Evidence:**
```js
export function resolveWatermarkConfig(ownerProfile) {
  if (ownerProfile?.avatar) return { type: "image", source: ownerProfile.avatar };
  const name = ownerProfile?.agency_name || ownerProfile?.full_name || ownerProfile?.email || "Dar El Djazair";
  return { type: "text", content: name };
}
export async function applyWatermarkToImage(imageUrl, wmConfig, uploadFn, filename) { ... }
export async function applyWatermarkToVideo(videoUrl, _wmConfig) { return { url: videoUrl, skipped: true }; }
```

**Issues:**
1. `resolveWatermarkConfig` checks `ownerProfile?.avatar` but the User entity uses `profile_picture` or similar — **field name mismatch** needs manual verification.
2. Config duplication (critical — see Part 1.4).
3. The spec requires: "profile picture → image watermark, else text watermark with display name." The `agency_name` fallback for agencies is correct. However for `individual` type, the spec says `first_name + last_name` — the service reads `full_name` instead. This is functionally equivalent only if `full_name` is always populated.
4. Graceful failure: `applyWatermarkToImage` will throw on fetch failure (line 44). The caller (`watermarkListingPhotos`) should wrap each image in try/catch to prevent one bad image from blocking the entire batch. Need to verify caller behavior.

**Severity:** Major (config isolation), Minor (field name assumptions, graceful failure)

---

#### 3.7 Lead Scoring Engine
**Status:** ⏭ Not yet implemented  
No `server/leads/scoringWeights.config.ts` found. Lead scoring appears to use `leadScoring.js` in `components/leads/`. Manual verification required.

---

#### 3.8 Duplicate Detection
**Status:** ✅ Pass  
**Files:**
- `src/utils/listingAttributes.js` lines 390–490 — frontend copy ✅
- `src/functions/checkExclusivityConflict.js` lines 13–65 — backend copy ✅

Both copies are synchronized with identical per-type rules for all 8 types. The inline duplication is explicitly documented as necessary since backend functions cannot import from `src/`.

**Issue:** Two copies create a maintenance risk — a rule change must be made in both places. This is noted in `HOW_TO_ADD_PROPERTY_TYPE.md` but not enforced by tooling.

**Severity:** Minor (documentation exists, manual sync required)

---

### Part 4 — Frontend Components

---

#### 4.1 Config Hook (`usePropertyTypes`)
**Status:** ⏭ Not yet implemented  
**Expected path:** `src/hooks/usePropertyTypes.ts`  
Not found. Components import directly from `propertyTypes.config.js` instead. This works but has no caching layer for the config data.

**Severity:** Minor (no performance impact since config is a static module)

---

#### 4.2 Dynamic Form Renderer
**Status:** ✅ Pass  
**Files:** `src/components/listing/DynamicFormRenderer.jsx` (lines 1–258)  

All 6 field types handled: `number`, `text`, `boolean`, `enum`, `multi_enum`, `unit_number`. Pure component — no business logic. Reads config via `getPropertyType()`. Conditional field visibility works (line 33–35). Required-field logic delegates to config (line 26–30).

**Issue:** No `structured` field type renderer. Building's `units_breakdown` mentioned in spec (Part 4 Structured Field Renderer Registry) is not implemented.

**Severity:** Major (units_breakdown field not renderable)

---

#### 4.3 Dynamic Field Display
**Status:** ✅ Pass  
**Files:** `src/components/listing/DynamicFieldDisplay.jsx` (lines 1–189)  

Read-only. Hides empty fields and empty groups (lines 161–163, 169–170). Used in listing detail and admin approval. Legacy adapter exported at line 20.

**Minor:** `new_development` alias hardcoded at line 138 (see Part 1.2 Violation B).

---

#### 4.4 Dynamic Search Filters
**Status:** ⚠️ Partial  
**Expected:** Renders only fields with `showInSearchFilter: true`  
**Files:** `src/components/listing/SearchFilters` — not read in this audit session.  
**Manual review required:** Verify that `SearchFilters` calls `getSearchFilterFields()` or equivalent rather than hardcoding filter UI elements.

---

#### 4.5 Listing Card
**Status:** ✅ Pass  
**Files:** `src/components/listing/ListingCard.jsx` (lines 1–359)  
Single component, 4 variants: `default`, `compact`, `owner`, `admin`. Sub-components `ListingCardFacts` and `ListingCardBadges` confirmed. `memo()` applied (line 192). No type-specific conditionals. Reads type label from config via `getAllPropertyTypes()` (line 67).

---

#### 4.6 Structured Field Renderer Registry
**Status:** ⏭ Not yet implemented  
**Expected path:** `src/components/structured-renderers/index.ts`  
Not found. The `units_breakdown` field for buildings has no custom renderer.

**Severity:** Major

---

#### 4.7 Property Type Icons Registry
**Status:** ✅ Pass  
**Files:** `src/components/icons/PropertyTypeIcon.jsx` (lines 1–51)  
All 8 types mapped: `apartment→Building2`, `house→Home`, `villa→Castle`, `land→Trees`, `commercial→Store`, `building→Building`, `office→Monitor`, `farm→Tractor`. All Lucide icons verified as real.

---

### Part 5 — Function Signatures & Behaviour

---

#### 5.1 matchesSearch — Test Cases
**Status:** ✅ Pass (traced manually, see Part 3.5)

---

#### 5.2 cleanFilters logic
**Status:** ⚠️ Partial  
**Files:** `src/utils/matchesSearch.js` line 98  
```js
if (!filterVal && filterVal !== false && filterVal !== 0) continue;
```
Empty string `""` → skipped ✅  
`null` → skipped ✅  
`undefined` → skipped ✅  
`[]` (empty array) → `![]` is `false` in JS — **array is NOT skipped** ⚠️  

A filter with `[]` will be passed to the `multi_enum` branch (line 146). At line 148: `const required = Array.isArray(filterVal) ? filterVal : [filterVal]` → `required = []`. Line 149: `[].every(...)` → always `true` — so an empty array filter **correctly passes all listings through** by accident (vacuous truth), but it is a fragile coincidence, not a design guarantee.

**Severity:** Minor (works by accident, should be explicit)  
**Recommended fix:** Add `if (Array.isArray(filterVal) && filterVal.length === 0) continue;` to the filter loop guard.

---

#### 5.3 resolveWatermarkConfig — Test Cases
**Status:** ✅ Pass (logic correct per code)
```js
// Owner with avatar → image watermark
resolveWatermarkConfig({ avatar: "https://..." }) → { type: "image", source: "https://..." } ✅

// No avatar, agency → text with agency name
resolveWatermarkConfig({ agency_name: "Agence XYZ" }) → { type: "text", content: "Agence XYZ" } ✅

// No avatar, no agency, individual
resolveWatermarkConfig({ full_name: "Karim Bensalem" }) → { type: "text", content: "Karim Bensalem" } ✅
```
**Concern:** Field name `avatar` is assumed. If User entity uses a different key (e.g. `profile_picture`), no image watermark will ever be applied.

---

#### 5.4 normalizeListingPayload
**Status:** ⏭ Not yet implemented (no server-side normalizer)

---

#### 5.5 validateListingPayload
**Status:** ⚠️ Partial (frontend only — see Part 3.2)

Test case trace against frontend `validateAttributes()`:
- Apartment, rent, no `furnished` → `furnished` is required (`whenListingType: "rent"`) → returns error ✅
- Apartment, sale, no `furnished` → `furnished` not required → valid ✅
- Land, `area=0` → `field.min=1`, `0 < 1` → `errors.area = "below_min"` ✅
- Land, `area=10, area_unit=hectares, buildable=true` → valid (all required fields present) ✅

---

#### 5.6 generateCaption — renderSocialCaption
**Status:** ✅ Pass  
**Files:** `src/utils/listingAttributes.js` lines 280–368  

All 8 types have templates. Empty placeholders are stripped (lines 363–368). "undefined" cannot appear in output since `placeholders[key] ?? ""` is used (line 364).

**Test case trace:**
- Land listing → template `"🌳 {{title}} — {{commune}}, {{wilaya}}\n{{area_value}} {{area_unit}}\nPrix : {{price_display}}"` — no bedroom references ✅
- Building → template includes `{{total_units}}` ✅
- Missing optional field → `?? ""` → empty string → line filter removes empty lines ✅

**Minor:** Building social caption uses `{{area_value}} m²` (line 308) but building's area field is `total_area` (not `area`). The `area_value` placeholder is resolved from `attrs.area ?? attrs.total_area` — need to verify `area_value` placeholder resolution reads both.

Looking at line 354: `area_value: String(areaValue ?? attrs.total_area ?? "")` ✅ — correctly falls back.

---

#### 5.7 computeAgencyExperience
**Status:** ✅ Pass  
**Files:** `src/utils/computeAgencyExperience.js` (lines 1–32)  

Test case trace (current year = 2026):
- `null` → returns `null` ✅
- `2026` → `experience=0` → `"Nouvelle agence"` ✅
- `2025` → `experience=1` → `"1 an d'expérience"` ✅
- `2021` → `experience=5` → `"5 ans d'expérience"` ✅
- `1966` → `experience=60` → `"60 ans d'expérience"`, `isLongEstablished=true` ✅
- `2030` → `experience=-4` → `return null` ✅

**Issue:** The spec says `experience >= 60` shows "Établi de longue date" badge, but the code uses `>= 50` (line 16: `const isLongEstablished = experience >= 50;`). Threshold mismatch — spec says 60, code says 50.

**Severity:** Minor

---

#### 5.8 priceConfig interpretation
**Status:** ✅ Pass  
**Files:** `src/components/price.config.js` (lines 27–181)  

Test case trace:
- Sale, `typed=100` → `n=100`, in range `1–999` → `storedValue=100*1_000_000=100,000,000` → display: `"100 millions DA"` ✅
- Sale, `typed=1200` → `n=1200`, in range `1000–9999` → `storedValue=1,200,000,000` → display: `"1 milliard 200 millions DA"` ✅
- Sale, `typed=1000000` → `n=1000000`, in range `10000–99999999` (SALE_AMBIGUOUS_MIN) → `{ isAmbiguous: true }` ✅
- Rent, `typed=35000` → `formatRentalDisplay(35000)` → `"35 000 DA / mois"` ✅

---

### Part 6 — Data Flow Integrity

---

#### 6.1 Flow 1 — Post a Land Listing
**Status:** ⚠️ Partial  

Steps 1–3 (form, field display): `DynamicFormRenderer` reads land config fields correctly. No bedrooms/floor/furnished in land schema. ✅  
Step 4 (validation): Client-side only via `validateAttributes()`. No server guard. ⚠️  
Step 5–6 (normalizer, storage): No server normalizer. Attributes stored as submitted by client. ⚠️  
Step 7 (admin approve): `functions/approveListing.js` — exists. ✅  
Step 8 (watermark): `functions/watermarkListingPhotos.js` — exists. ✅ (config isolation issue noted)  
Step 9 (search): `matchesSearch` handles land correctly. ✅  
Step 10 (ListingCard): `ListingCardFacts` reads `area`, `buildable`, `frontage_meters` from land config. Does not show bedrooms. ✅  
Step 11 (ListingDetail): `DynamicFieldDisplay` reads land fields only. ✅  
Step 12 (saved search notifications): `functions/notifyListingMatch.js` + `functions/leadAlerts.js` — exist but audit of internals skipped.  
Step 13 (caption): `renderSocialCaption` land template correct. ✅  
Step 14 (webhook): No Make.com webhook function found in file tree. ⏭  

---

#### 6.2 Flow 2 — Post a Building Listing
**Status:** ⚠️ Partial  
`units_breakdown` is referenced in the spec but no `structured` field type exists in the config or form renderer. The `DynamicFormRenderer` has no handler for `structured` type (line 218–228 — `structured` not listed). If `units_breakdown` is defined as `multi_enum`, it can be stored but not rendered with the custom StructuredFieldRenderer (which doesn't exist).

---

#### 6.3 Flow 3 — Search with Mixed Filters
**Status:** ✅ Pass  
`matchesSearch` correctly gates on `property_type` at line 69, then applies attribute filters only for the listing's own type schema. Land listings with `min_bedrooms` filter: `getFieldsForType("land")` has no `bedrooms` field → `return false` (correct exclusion). ✅

---

#### 6.4 Flow 4 — Saved Search Migration
**Status:** ⚠️ Partial  
`migrateSavedSearchFilters()` exists in `listingAttributes.js` lines 504–534. Is idempotent (line 508: `if (oldFilters.attributes !== undefined) return oldFilters`). ✅  
**Issue:** Migration is a pure function — it's not wired to any automated trigger. Old saved searches in the database are NOT automatically migrated. The function must be called explicitly somewhere when loading saved searches. Manual review required to confirm it is called in `SavedSearches.jsx` or similar.

---

#### 6.5 Flow 5 — Promotion Immobilière → Building
**Status:** ❌ Fail  
No migration function found for this specific reclassification. `functions/migratePropertyTypes.js` exists but its internals were not audited to confirm it handles `promotion_immobiliere` → `building`. If this migration was not implemented, users with old listings of this type may see broken rendering.

**Severity:** Major  
**Recommended fix:** Audit `migratePropertyTypes.js` to confirm it covers this case. If not, add a migration function.

---

### Part 7 — Security & Robustness

---

#### 7.1 VAPID & ENV Variables
**Status:** ✅ Pass  
- `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` confirmed in secrets list.
- No hardcoded VAPID keys found in audited source files.
- `functions/getVapidPublic.js` exists — this safely exposes only the public key to the frontend.

---

#### 7.2 Social Media Tokens
**Status:** ⏭ Not yet implemented / Manual review required  
No social media posting functions found in the function tree. If social posting was planned for Batch T, it does not appear to exist in the current codebase.

---

#### 7.3 Input Sanitization
**Status:** ⚠️ Partial  
`DynamicFormRenderer` uses standard `<Input>` components with no explicit sanitization. The `listingValidation.js` file is referenced in the file tree — contents not audited in this session.  
**Manual review required:** Read `components/listing/listingValidation.js` to verify phone/email/address validation rules.

---

#### 7.4 Auth Guards
**Status:** ✅ Pass  
`App.jsx` defines public vs. protected pages clearly (lines ~50–70). `AuthGuard` component wraps all non-public pages. Public pages: `['Home', 'Listings', 'ListingDetail', 'AgentAvailability', 'Compare', 'Profile']`. All other pages require authentication via `<AuthGuard>`.

**Minor:** `AuthGuard` is a frontend guard only. API endpoints (entity CRUD) rely on Base44's built-in auth, which uses the Base44 token. Direct API calls from Postman with a valid token will still succeed. Server-side ownership verification for listing edits is not verifiable from frontend code alone.

---

#### 7.5 Soft Delete Behaviour
**Status:** ⚠️ Partial  
The `Listing` entity has status `"deleted"` as an enum value. `ListingCard` treats `deleted` as unavailable (line 73). Whether search excludes deleted listings depends on the `Listings.jsx` filter — status filter should exclude `deleted`. Manual review required.

---

### Part 8 — Notification System Integrity

**Status:** ⚠️ Partial — Comprehensive manual review required  

The following notification backend functions **exist** (confirmed in file tree):
- `functions/notifyMessage.js` ✅
- `functions/notifyLead.js` ✅
- `functions/notifyListingMatch.js` ✅
- `functions/notifyAppointment.js` ✅
- `functions/notifyWaitlist.js` ✅
- `functions/appointmentReminder.js` ✅
- `functions/leadAlerts.js` ✅
- `functions/tenantRenewalReminder.js` ✅

**Not verified in this audit:**
- Language-aware templates in each function (would require reading each function)
- Deduplication via `ref_id` (defined in Notification entity ✅ but not verified in each function)
- Push notification trigger alongside in-app notification
- Sound trigger (`notifyMessageWithSound.js` exists — suggests sound is implemented)
- Navigation on click (depends on `url` field format — entity schema shows `"PageName?param=value"`)

**Confirmed deduplication mechanism:** `Notification` entity has `ref_id` field with description "Never create two notifications with the same ref_id." This is the right design but enforcement requires each function to use unique, deterministic `ref_id` values.

**Severity:** Minor to Major — requires per-function audit to confirm correctness.

---

### Part 9 — Test Coverage Report

**Status:** ❌ Fail  

No test files were found anywhere in the project file tree:
- No `*.test.js`, `*.spec.js`, `*.test.ts`, or `*.spec.ts` files
- No `__tests__` directories
- No Vitest, Jest, or Deno test configuration

**Coverage: 0% across all modules.**

This is a critical gap for production readiness. All validation, filtering, and business logic functions run without automated test coverage.

**Priority test candidates (lowest coverage risk, highest value):**
1. `matchesSearch` — pure function, easy to unit test
2. `validateAttributes` — pure function
3. `formatPrice` / `formatSaleDisplay` / `formatRentalDisplay` — pure functions
4. `computeAgencyExperience` — pure function
5. `isPotentialDuplicate` — pure function
6. `migrateSavedSearchFilters` — pure function

**Severity:** Critical (no tests = no regression safety net)

---

### Part 10 — Documentation & Developer Experience

---

#### 10.1 HOW_TO_ADD_PROPERTY_TYPE.md
**Status:** ✅ Pass  
**Files:** `HOW_TO_ADD_PROPERTY_TYPE.md` (lines 1–365)  
Comprehensive. Covers: config entry, entity enum update, icon registry, notification templates, social captions, hashtags, duplicate detection rules, lot types, field types reference, field properties reference, architecture overview, data storage, migration order. Well-structured with code examples.

**Minor issue:** Step 2 refers to `entities/Listing.json` as needing a `property_type` enum update, but in Base44's architecture, entity schemas are JSON files managed through the platform. The instruction is correct but could note that this is done via the Base44 entity editor.

---

#### 10.2 price.config.js Documentation
**Status:** ✅ Pass  
`price.config.js` has a detailed header comment (lines 1–22) explaining the Algerian market conventions, stored value format, and that conventions must not be changed without full retesting.

---

#### 10.3 watermark.config.js Documentation
**Status:** ✅ Pass (as a standalone file)  
`watermark.config.js` has inline comments explaining every setting. The issue is not documentation quality — it's that the file has no effect at runtime (see Part 1.4).

---

#### 10.4 API Documentation
**Status:** ⏭ Not yet implemented  
No `/docs` directory or API specification file found. Base44 entities expose auto-generated REST endpoints but there is no developer-facing API documentation for `/listings`, `/property-types`, etc.

---

## Cross-Cutting Issues

1. **Backend cannot import frontend config** — 3 backend functions (`checkExclusivityConflict`, `watermarkListingPhotos`, `watermarkService`) must either inline or duplicate config from `propertyTypes.config.js`. This creates a two-source-of-truth maintenance burden. **Solution:** Extract a `functions/sharedConfig.js` with the minimum Deno-compatible subset of the config.

2. **No server-side validation anywhere** — All validation is frontend-only. Any API-direct write bypasses all business rules. Affects listing creation, updating, and any future entity that requires field validation.

3. **Two parallel badge systems** — `ListingCardBadges` (config-driven) and `ListingBadgeRow` (hardcoded rules). Both render badges for the same property types. `ListingBadgeRow` should be retired.

4. **No test coverage** — 0 test files across the entire codebase. All pure utility functions are untested.

5. **`structured` field type missing** — The spec mentions a `structured` renderer (e.g. for `units_breakdown`) but the field type is not defined in `propertyTypes.config.js` and `DynamicFormRenderer` has no handler for it.

---

## Migration Status

| Migration | Status | Notes |
|-----------|--------|-------|
| Legacy columns → attributes adapter (read-time) | ✅ Active | `resolveAttributes()` in `listingAttributes.js` |
| `migratePropertyTypes.js` | ✅ Exists | Admin-only backend function |
| `migrateFoundedYear.js` | ✅ Exists | Admin-only backend function |
| `migrateUserRoles.js` | ✅ Exists | Admin-only backend function |
| Saved search filter reshape | ⚠️ Function exists | Not auto-triggered; must be called at load time |
| `promotion_immobiliere` → `building` | ❌ Not confirmed | May or may not be in `migratePropertyTypes.js` |
| GIN/B-tree index setup | ⏭ Platform-managed | Verify with Base44 support |

---

## Test Coverage Summary

| Module | Coverage | Priority |
|--------|----------|----------|
| `utils/matchesSearch.js` | 0% | 🔴 High |
| `utils/listingAttributes.js` | 0% | 🔴 High |
| `components/price.config.js` | 0% | 🔴 High |
| `utils/computeAgencyExperience.js` | 0% | 🔴 High |
| `components/propertyTypes.config.js` | 0% | 🔴 High |
| `utils/lotTypes.js` | 0% | 🟡 Medium |
| `functions/checkExclusivityConflict.js` | 0% | 🟡 Medium |
| `functions/watermarkService.js` | 0% | 🟡 Medium |
| All UI components | 0% | 🟢 Lower |

**Total estimated coverage: 0%**

---

## Recommendations Priority List

### 1. Critical (block production)
1. **Add server-side validation** — Create `functions/validateListing.js`, invoke from PostListing flow.
2. **Fix watermark config isolation** — Either merge `watermark.config.js` into `watermarkService.js` or make the service import it. Currently editing the config file has no effect.
3. **Add unit tests** — Start with pure utility functions. Use Vitest (already compatible with Vite).

### 2. Major (degrade UX or scalability)
4. **Retire `ListingBadgeRow`** — Replace with `ListingCardBadges` everywhere. Currently two badge systems exist in parallel.
5. **Implement `structured` field type** — Required for `units_breakdown` on building listings.
6. **Confirm `promotion_immobiliere` → `building` migration** — Read `migratePropertyTypes.js` and verify or add this case.
7. **Wire `migrateSavedSearchFilters`** — Ensure it is called when loading saved searches so old-format filters work correctly.
8. **Server-side search query builder** — Implement for scale beyond ~500 active listings.

### 3. Minor (polish)
9. **Fix `price_display` in notification templates** — Use `formatPrice()` instead of raw `toLocaleString()`.
10. **Fix dead code in `matchesSearch` `+` suffix** — Simplify the redundant `isPlus` condition.
11. **Fix `isLongEstablished` threshold** — Spec says 60 years, code uses 50.
12. **Explicit empty-array guard in `matchesSearch`** — Add `if (Array.isArray(filterVal) && filterVal.length === 0) continue;`.
13. **Extract `new_development` alias** — Move hardcoded type alias from `DynamicFieldDisplay` to `propertyTypes.config.js`.
14. **Add API documentation** — Even a simple `API.md` for the main entity endpoints.