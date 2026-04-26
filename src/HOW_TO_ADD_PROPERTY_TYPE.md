# How to Add a Property Type or Field

## Single Source of Truth

All property type definitions live in **one file**:

```
src/components/propertyTypes.config.js
```

Editing this file is the **only step needed** for 99% of changes.
All layers — PostListing form, listing detail display, search filters,
validation, and the DB schema — read from this config automatically.

---

## Adding a New Property Type

1. Open `src/components/propertyTypes.config.js`
2. Add a new entry to the `PROPERTY_TYPE_DEFS` array:

```js
{
  key: "chalet",                                 // unique slug
  label: { en: "Chalet", fr: "Chalet", ar: "شاليه" },
  icon: "🏔️",
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
    },
    // ... add more fields
  ],
},
```

3. Update the Listing entity enum in `entities/Listing.json`:
   Add `"chalet"` to the `property_type` enum array.

That's it. The posting form, detail page, search filters, and validation
all automatically pick up the new type.

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

---

## Field Types Reference

| type         | UI component         | Notes                                      |
|--------------|---------------------|--------------------------------------------|
| `number`     | Numeric input        | Supports `min`, `max`, `unit`, `warnBelow`, `warnAbove` |
| `text`       | Text input           |                                            |
| `boolean`    | Toggle button        | Rendered in a grid with other booleans     |
| `enum`       | Select dropdown      | Requires `options` array                   |
| `multi_enum` | Multi-select chips   | Requires `options` array                   |
| `unit_number`| Number + unit select | Requires `unitOptions` array (e.g. `["m²","hectares"]`) |

---

## Field Properties Reference

| Property            | Required | Description                                                                 |
|---------------------|----------|-----------------------------------------------------------------------------|
| `key`               | ✅       | Unique field key (stored in `listing.attributes[key]`)                     |
| `type`              | ✅       | One of the types above                                                      |
| `required`          | ✅       | `true`, `false`, or `{ whenListingType: "rent" \| "sale" }`               |
| `label`             | ✅       | `{ en, fr, ar }` object                                                    |
| `group`             | ✅       | Must match one of the type's `groups[].key` values                         |
| `options`           | for enum | `Array<{ value, label: { en, fr, ar } }>`                                  |
| `unitOptions`       | for unit_number | `string[]` e.g. `["m²", "hectares"]`                              |
| `unit`              | —        | Display unit suffix for number fields                                       |
| `min` / `max`       | —        | Validation constraints for number fields                                    |
| `warnBelow` / `warnAbove` | —  | Show warning (not error) outside this range                                |
| `showInSearchFilter`| —        | Show this field in the advanced search filter panel                        |
| `showInListingCard` | —        | Show this field in the listing card summary                                |
| `conditional`       | —        | `{ field: string, value: any }` — only show if another field equals value |
| `placeholder`       | —        | `{ en, fr, ar }` placeholder text                                          |

---

## Architecture Overview

```
propertyTypes.config.js          ← SINGLE SOURCE OF TRUTH
       │
       ├─ pages/PostListing       ← DynamicFormRenderer reads from config
       ├─ pages/ListingDetail     ← DynamicFieldDisplay reads from config
       ├─ components/listing/DynamicFormRenderer.jsx
       ├─ components/listing/DynamicFieldDisplay.jsx
       ├─ components/listing/listingValidation.js  ← type helpers derived from config
       ├─ components/constants.js  ← re-exports PROPERTY_TYPES from config
       └─ entities/Listing.json   ← property_type enum updated manually
```

---

## Data Storage

Type-specific field values are stored in `listing.attributes` (a flexible JSON object).
Core indexed fields (`area`, `rooms`, `bedrooms`, `bathrooms`, `floor`, `furnished`)
are also kept as top-level columns for backward compatibility with existing filters.

---

## Migration

When renaming or replacing a property type, create a backend function
similar to `functions/migratePropertyTypes.js` that loops over existing
listings and updates the `property_type` field. The function is idempotent
and admin-only.