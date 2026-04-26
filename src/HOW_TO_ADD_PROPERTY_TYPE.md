# How to Add a Property Type or Field

## Single Source of Truth

All property type definitions live in **one file**:

```
src/components/propertyTypes.config.js
```

Editing this file is the **only step needed** for 99% of changes.
All layers — PostListing form, listing detail display, search filters,
listing cards, compare view, CSV/PDF export, exclusivity detection,
notification templates, social captions, and validation — read from
this config automatically.

---

## Adding a New Property Type

To add a new property type, edit **approximately 3 files**:

### 1. `src/components/propertyTypes.config.js` (required)

Add a new entry to the `PROPERTY_TYPE_DEFS` array:

```js
{
  key: "chalet",
  label: { en: "Chalet", fr: "Chalet", ar: "شاليه" },
  icon: "🏔️",   // emoji icon (used in config)
  lucideIcon: "Mountain",  // icon key for the icon registry
  groups: [
    { key: "surfaces",        label: { en: "Surfaces", fr: "Surfaces", ar: "المساحات" }, order: 1 },
    { key: "characteristics", label: { en: "Characteristics", fr: "Caractéristiques", ar: "الخصائص" }, order: 2 },
    { key: "amenities",       label: { en: "Amenities", fr: "Équipements", ar: "المرافق" }, order: 3 },
  ],
  fields: [
    {
      key: "area",
      type: "number",
      required: true,
      label: { en: "Area (m²)", fr: "Surface (m²)", ar: "المساحة" },
      unit: "m²",
      min: 1,
      group: "surfaces",
      showInSearchFilter: true,
      showInListingCard: true,
      cardOrder: 1,
      cardIcon: "ruler",
      cardFormat: "value_unit",
    },
    // ... add more fields
  ],
},
```

### 2. `entities/Listing.json` (required)

Add `"chalet"` to the `property_type` enum array.

### 3. `src/components/icons/PropertyTypeIcon.jsx` (required)

Add the icon mapping for `"chalet"`. See the **Icon Registry** section below.

That's it. The following systems automatically pick up the new type:

| System | How it picks up new types |
|--------|--------------------------|
| PostListing form | `DynamicFormRenderer` reads config |
| Listing detail | `DynamicFieldDisplay` reads config |
| Search filters | `SearchFilters` + `getSearchFilterFields()` |
| Listing cards | `ListingCardFacts` + `ListingCardBadges` |
| Compare page | Reads field defs per type, auto-detects common fields |
| CSV export | Union of all field keys across exported listings |
| PDF export | Dynamic attribute section per listing |
| matchesSearch | Reads field defs from config for attribute filtering |
| Exclusivity detection | Uses `DUPLICATE_DETECTION_CONFIG` (add entry there too) |
| Notifications | Uses `NOTIFICATION_TEMPLATES` (add entry in `listingAttributes.js`) |
| Social captions | Uses `SOCIAL_CAPTION_TEMPLATES` (add entry in `listingAttributes.js`) |
| Hashtag suggestions | Uses `TYPE_HASHTAGS` (add entry in `listingAttributes.js`) |
| Validation | `validateAttributes()` reads required/min/max from config |

---

## Adding a Field to an Existing Type

1. Open `src/components/propertyTypes.config.js`
2. Find the property type (e.g. `"apartment"`)
3. Add a new entry to its `fields` array:

```js
{
  key: "has_storage",
  type: "boolean",
  required: false,
  label: { en: "Storage Room", fr: "Cave / Débarras", ar: "مخزن" },
  group: "amenities",
  showInSearchFilter: false,
  showInListingCard: false,
},
```

Done. No other files need to change.

**To show the field in the listing card:**
```js
showInListingCard: true,
cardOrder: 6,          // lower = higher priority
cardIcon: "archive",   // icon key from ListingCardFacts icon map
cardFormat: "boolean_chip",  // or "value_unit", "icon_value", "enum_label"
```

**To show the field as a badge on the card:**
```js
showAsCardBadge: true,
cardBadgePriority: 7,           // higher = shown first
cardBadgeStyle: "positive",     // "positive" | "neutral" | "warning"
cardBadgeCondition: "if_true",  // "if_true" | "if_false" | "always" | "rent_only" | "sale_only"
cardBadgeLabel: { en: { true: "Storage" }, fr: { true: "Cave" }, ar: { true: "مخزن" } },
```

**To make the field filterable in search:**
```js
showInSearchFilter: true,
```

---

## matchesSearch — How New Fields Are Picked Up

The `matchesSearch` function in `src/utils/matchesSearch.js` is config-driven.

When a filter key is present in the filter object that matches a field key
in the config for the listing's property type, the comparison is applied
automatically based on the field's `type`:

| Filter key format | Meaning |
|------------------|---------|
| `min_<key>`      | Numeric lower bound |
| `max_<key>`      | Numeric upper bound |
| `<key>`          | Exact match (enum, boolean, etc.) |

**Example:** Adding `has_storage: boolean` to apartment config means
that passing `{ has_storage: true }` as a filter will automatically
filter apartments where `attributes.has_storage === true`.

If a filter key references a field that **does not exist** for a listing's
property type, the listing is excluded (no false positives).

**Unit-aware fields** (`unit_number` type, e.g. land area in m² or hectares):
Both the filter value and the listing value are normalized to m² before
comparison, so filters always work regardless of which unit was used at entry.

---

## Notification Templates

When a new property type is added, add matching templates in
`src/utils/listingAttributes.js` under `NOTIFICATION_TEMPLATES`:

```js
chalet: {
  matchedListing: {
    en: "A chalet of {{area_value}} m² in {{commune}}, {{wilaya}}",
    fr: "Un chalet de {{area_value}} m² à {{commune}}, {{wilaya}}",
    ar: "شاليه {{area_value}} م² في {{commune}}، {{wilaya}}",
  },
  reservedListing: { ... },
  soldListing: { ... },
  rentedListing: { ... },
  availableAgain: { ... },
},
```

Available placeholders: `{{commune}}`, `{{wilaya}}`, `{{bedrooms}}`,
`{{area_value}}`, `{{area_unit}}`, `{{total_area_value}}`, `{{total_units}}`,
`{{price_display}}`.

Unknown or empty placeholders are removed gracefully — no "undefined" output.

---

## Social Caption Templates

Add a matching entry in `src/utils/listingAttributes.js` under
`SOCIAL_CAPTION_TEMPLATES`:

```js
chalet: {
  en: "🏔️ {{title}} — {{commune}}, {{wilaya}}\n{{area_value}} m²\nPrice: {{price_display}}",
  fr: "🏔️ {{title}} — {{commune}}, {{wilaya}}\n{{area_value}} m²\nPrix : {{price_display}}",
  ar: "🏔️ {{title}} — {{commune}}، {{wilaya}}\n{{area_value}} م²\nالسعر: {{price_display}}",
},
```

And hashtags under `TYPE_HASHTAGS`:

```js
chalet: ["#chalet", "#montagne", "#immobilier"],
```

---

## Duplicate Detection Rules

Add an entry in `src/utils/listingAttributes.js` under
`DUPLICATE_DETECTION_CONFIG`, **and** in `functions/checkExclusivityConflict.js`
(since backend functions cannot import from src):

```js
chalet: [
  { field: "wilaya",  tolerance: null, source: "listing" },
  { field: "commune", tolerance: null, source: "listing" },
  { field: "price",   tolerance: 0.10, source: "listing" },
  { field: "area",    tolerance: 0.10, source: "attr" },
],
```

Rules:
- `tolerance: null` → exact string match (case-insensitive)
- `tolerance: 0.10` → numeric values within 10% of each other
- `source: "listing"` → read from top-level listing column
- `source: "attr"` → read from `listing.attributes`
- `normalize: "m2"` → for unit_number fields, normalize to m² before compare

---

## Icon Registry

Property type icons are registered in:

```
src/components/icons/PropertyTypeIcon.jsx
```

Add the new type's Lucide icon there. All UI surfaces (listing cards,
detail page, form, search filters) read from this registry by key.

---

## Lot Types (for Projects and Building units)

Shared lot type values are defined in:

```
src/utils/lotTypes.js
```

Both the Project entity and building `units_breakdown` field reference
this enum. Do not hardcode lot type strings anywhere else.

---

## Field Types Reference

| type         | UI component         | Notes |
|--------------|---------------------|-------|
| `number`     | Numeric input        | Supports `min`, `max`, `unit`, `warnBelow`, `warnAbove` |
| `text`       | Text input           | |
| `boolean`    | Toggle button        | Rendered in a grid with other booleans |
| `enum`       | Select dropdown      | Requires `options` array |
| `multi_enum` | Multi-select chips   | Requires `options` array |
| `unit_number`| Number + unit select | Requires `unitOptions` array (e.g. `["m²","hectares"]`) |

---

## Field Properties Reference

| Property                  | Required | Description |
|---------------------------|----------|-------------|
| `key`                     | ✅       | Unique field key (stored in `listing.attributes[key]`) |
| `type`                    | ✅       | One of the types above |
| `required`                | ✅       | `true`, `false`, or `{ whenListingType: "rent" | "sale" }` |
| `label`                   | ✅       | `{ en, fr, ar }` object |
| `group`                   | ✅       | Must match one of the type's `groups[].key` values |
| `options`                 | for enum | `Array<{ value, label: { en, fr, ar } }>` |
| `unitOptions`             | for unit_number | `string[]` e.g. `["m²", "hectares"]` |
| `unit`                    | —        | Display unit suffix for number fields |
| `min` / `max`             | —        | Validation constraints |
| `warnBelow` / `warnAbove` | —        | Show warning (not error) outside this range |
| `showInSearchFilter`      | —        | Show in advanced search filter panel |
| `showInListingCard`       | —        | Show in listing card summary |
| `showAsCardBadge`         | —        | Show as badge chip on the listing card |
| `cardOrder`               | —        | Priority in card facts row (lower = first) |
| `cardBadgePriority`       | —        | Priority in badge row (higher = first) |
| `cardBadgeStyle`          | —        | `"positive"` | `"neutral"` | `"warning"` |
| `cardBadgeCondition`      | —        | When to show: `"if_true"` | `"always"` | `"rent_only"` | etc. |
| `cardBadgeLabel`          | —        | `{ [lang]: { true?, false?, [enumVal]? } }` |
| `cardIcon`                | —        | Icon key resolved in `ListingCardFacts` |
| `cardFormat`              | —        | `"value_unit"` | `"icon_value"` | `"boolean_chip"` | `"enum_label"` |
| `conditional`             | —        | `{ field: string, value: any }` — only show if another field equals value |
| `placeholder`             | —        | `{ en, fr, ar }` placeholder text |

---

## Architecture Overview

```
propertyTypes.config.js              ← SINGLE SOURCE OF TRUTH
       │
       ├─ pages/PostListing           ← DynamicFormRenderer reads from config
       ├─ pages/ListingDetail         ← DynamicFieldDisplay reads from config
       ├─ pages/Compare               ← Builds rows from config, handles mixed types
       ├─ components/listing/ListingCard          ← ListingCardFacts + ListingCardBadges
       ├─ components/listing/DynamicFormRenderer
       ├─ components/listing/DynamicFieldDisplay
       ├─ components/listing/SearchFilters
       ├─ components/ExportButton     ← Dynamic CSV columns + PDF attribute section
       ├─ components/icons/PropertyTypeIcon.jsx   ← Icon registry
       ├─ utils/matchesSearch.js      ← Config-driven listing filter (pure function)
       ├─ utils/listingAttributes.js  ← Attribute resolution, formatting, notifications,
       │                                 social captions, duplicate detection config
       ├─ utils/lotTypes.js           ← Shared lot type enum
       ├─ functions/checkExclusivityConflict  ← Uses per-type duplicate detection rules
       └─ entities/Listing.json       ← property_type enum updated manually
```

---

## Data Storage

Type-specific field values are stored in `listing.attributes` (flexible JSON).
Legacy top-level columns (`area`, `rooms`, `bedrooms`, `bathrooms`, `floor`,
`furnished`) are read by the `resolveAttributes()` adapter in
`utils/listingAttributes.js` for backward compatibility.

All code should call `resolveAttributes(listing)` instead of reading
`listing.attributes` directly, so legacy data renders correctly without
any database migration.

---

## Migration

### Adding a new type to existing listings
Create a backend function similar to `functions/migratePropertyTypes.js`.
The function is idempotent and admin-only.

### Legacy column → attributes migration
The `resolveAttributes()` adapter in `utils/listingAttributes.js` handles
this transparently at read time. No database migration is needed.

### Saved search filter migration
Call `migrateSavedSearchFilters(oldFilters)` from `utils/listingAttributes.js`
to convert old flat filter shapes to the new `{ attributes: {} }` shape.
The function is idempotent — safe to run multiple times.

---

---

## Marketplace Filters

Fields that appear in the filter panel are controlled by the `showInSearchFilter` flag in each field definition.

When `showInSearchFilter: true`, `DynamicSearchFilters` will automatically render the appropriate input:
- `boolean` → Yes/No/Any chip group
- `enum` → Select dropdown
- `unit_number` → Min/Max inputs with unit toggle (e.g. m²/hectares)
- `number` → Min/Max numeric inputs (or min-only for count fields like bedrooms/floor)

No changes to the filter panel component are needed.

---

## Quick Filter Chips

Quick chips in the marketplace are defined in:

```
src/components/quickFilterChips.config.js
```

To add a chip for a new type:

```js
{
  id: "chalet_montagne",
  label: { fr: "Chalet de montagne", ar: "شاليه جبلي", en: "Mountain chalet" },
  icon: "🏔️",
  filters: {
    property_type: "chalet",
    // any additional filter keys
  },
},
```

The chip is automatically highlighted when the current filters match it, and clears those filters when tapped again.

---

## Type-Specific Sort Options

The marketplace dynamically adds sort options when a single property type is selected.

To add sort options for a new type, edit the `sortOptions` `useMemo` in `pages/Listings.jsx`:

```js
if (filters.property_type === "chalet") {
  extra.push({ value: "-altitude", label: { en: "Highest altitude", fr: "Plus haute altitude", ar: "أعلى ارتفاع" } });
}
```

---

## Map Pin Icons

Map pins use the icon registry from `components/icons/PropertyTypeIcon.jsx`.
When you add a new property type, register its Lucide icon there so map pins
render the correct icon for that type.

---

## URL State

All filter state is automatically encoded into the URL via `utils/urlFilterState.js`.

Universal filters use short URL keys (`pt`, `w`, `c`, `type`, etc.).
Dynamic attribute filters are encoded with the `attr_` prefix (e.g. `attr_min_bedrooms=2`).

No changes to `urlFilterState.js` are needed for new types — the encoder loops over all filter keys automatically.

---

## Migration Order of Operations

When deploying a new property type to production:

1. Update `propertyTypes.config.js` with the new type/field definitions.
2. Update `entities/Listing.json` to add the new enum value.
3. Register the icon in `components/icons/PropertyTypeIcon.jsx`.
4. Add notification/caption templates in `utils/listingAttributes.js`.
5. Add duplicate detection rules in both `utils/listingAttributes.js`
   and `functions/checkExclusivityConflict.js`.
6. Deploy. The `resolveAttributes()` adapter keeps legacy listings working.
7. Optionally backfill existing listings via a migration backend function.

Legacy top-level columns are kept indefinitely via the adapter — no hard
cutoff is enforced at the code level.