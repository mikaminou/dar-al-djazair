# Batch AD — Amenities Duplication Elimination

## Summary

This batch unified all property amenities from a static "Équipements généraux" block and scattered per-type fields into a single, configuration-driven system in `propertyTypes.config.js`. The legacy static amenities block has been completely removed from the posting form.

---

## Part 1: Removed Static Block

**Deleted from PostListing (pages/PostListing):**
- The "Équipements généraux" (General Amenities) block that rendered Parking, Garage, Jardin, Balcon, Terrasse, Piscine, Ascenseur, Sécurité, Climatisation, Chauffage, Panneaux solaires, Puits, Interphone, Double vitrage, Cave, Concierge, etc.
- Removed `toggleFeature()` function (no longer needed)
- Removed `FEATURES_LIST` import from constants
- `form.features` array is now cleared on save (migrated to attributes)

---

## Part 2: Unified Amenities in Config

All amenities are now defined per property type in `components/propertyTypes.config.js`:

### Universal Amenities (Available to most types)
```javascript
const UNIVERSAL_AMENITIES = [
  "security",
  "air_conditioning",
  "heating",
  "solar_panels",
  "well",
  "intercom",
  "double_glazing",
  "generator",
  "water_tank"
]
```

These are injected into each type's amenities group via spread operator:
```javascript
...UNIVERSAL_AMENITIES.map(opt => ({ 
  key: opt.value, type: "boolean", required: false, label: opt.label, 
  group: "amenities", showInSearchFilter: false, showInListingCard: false 
}))
```

### Per-Type Amenities

**APARTMENT:**
- balcony, parking, elevator, fiber_internet, terrace, cave, concierge
- + all universal amenities

**HOUSE:**
- garden, garage, terrace, pool, fiber_internet
- + all universal amenities

**VILLA:**
- garden, pool, garage_spots (number), terrace, fiber_internet
- + all universal amenities

**LAND:**
- has_water_access, has_electricity, has_road_access (infrastructure only)

**COMMERCIAL:**
- has_storefront, has_storage, parking, security, air_conditioning

**BUILDING:**
- has_elevator, parking_spots (number), has_basement, security, generator, water_tank

**OFFICE:**
- has_elevator, parking_spots, air_conditioning, fiber_internet, security

**FARM:**
- has_water_access, has_electricity
- equipment_included (multi_enum)
- livestock_included (multi_enum)

---

## Part 3: DynamicFormRenderer Enhancements

### Amenity Pills (Flex Wrap)
Amenity booleans now render as clickable pill toggles in a flex wrap layout:
- Selected: emerald-600 background + white text
- Unselected: white background + gray border
- Full pill is clickable (not just a radio indicator)

### Numeric Amenities (Stepper)
Numeric amenities (e.g., `parking_spots`, `garage_spots`) render with inline +/− stepper:
```
[−] 0 [+]
```
- Buttons respect min/max constraints
- Changes apply instantly

### Separate Rendering Logic
- Boolean amenities (group="amenities") → pill grid
- Non-amenity booleans (e.g., characteristics) → radio dot rows
- Numeric amenities (group="amenities") → stepper pills
- Other fields (text, enum, multi_enum, number) → standard inputs

---

## Part 4: Field Key Duplication Resolution

**Resolved Overlaps:**
- "garden" / "Jardin" — unique key, appears in house + villa configs
- "garage" — boolean in house; "garage_spots" — number in villa (distinct keys)
- "parking" — boolean in apartment, commercial, office, building configs
- "terrace" — boolean in apartment, house, villa

Each key appears at most once per property type. No cross-type collisions.

---

## Part 5: Draft Migration

**On Draft Load (PostListing):**
```javascript
// If legacy features array exists, move to attributes
if (listing.features && Array.isArray(listing.features)) {
  for (const feat of listing.features) {
    if (!migratedAttrs[feat]) {
      migratedAttrs[feat] = true;
    }
  }
}
```

**On Save:**
- `features: []` is explicitly set (clears legacy array)
- All amenity values live in `attributes`

---

## Part 6: Published Listings Migration

**Backend Function: `migrateListingAmenities.js`**

Admin-only utility to migrate published listings from legacy schema:

### Input
```javascript
{
  listing_id: "xyz123"
}
```

### Logic
1. Fetch listing
2. For each legacy feature string:
   - If it's a known amenity for this property type → move to `attributes[key] = true`
   - If it's a known legacy feature but wrong type → store in `attributes.legacy_features[]` for review
   - Unknown strings → skip
3. Clear `features[]` array
4. Save migrated listing

### Output
```javascript
{
  migrated: true,
  listing_id: "xyz123",
  property_type: "apartment",
  amenities_migrated: ["parking", "elevator", "garden"],
  unknown_features_stored: ["some_old_key"]
}
```

---

## Part 7: Verification Checklist

✅ **Form Rendering:**
- [ ] No "Équipements généraux" block exists in posting form
- [ ] Amenity pills appear for each property type
- [ ] Pills are clickable, full-width (not radio-style)
- [ ] Numeric amenities (parking_spots) use +/− stepper
- [ ] All amenities live under "Équipements" group in form

✅ **Data Persistence:**
- [ ] New listings save amenities in `attributes` (not `features`)
- [ ] Draft loader migrates legacy features → attributes
- [ ] Legacy drafts load without data loss
- [ ] Published listings can be migrated via admin function

✅ **No Duplication:**
- [ ] Each amenity key appears exactly once per property type
- [ ] Shared amenities (e.g., "parking") defined per-type only
- [ ] No overlap between static block + dynamic form

✅ **Configuration-Driven:**
- [ ] All amenity labels, types, visibility defined in config
- [ ] Adding new amenity = one entry in config, no code changes
- [ ] Property type is the source of truth for available amenities

✅ **Backward Compatibility:**
- [ ] Old drafts with flat `features` array load correctly
- [ ] Published listings retain amenity data
- [ ] Migration path exists for historical data

---

## Implementation Timeline

1. **Config Update** ✅ Added `UNIVERSAL_AMENITIES` constant + per-type amenity fields
2. **Form Removal** ✅ Deleted static "Équipements généraux" block
3. **DynamicFormRenderer Enhancement** ✅ Added amenity-specific pill rendering + stepper for numbers
4. **Draft Migration** ✅ Automatic legacy features → attributes on load
5. **Save Cleanup** ✅ `features: []` explicitly set on submit
6. **Admin Migration Function** ✅ `migrateListingAmenities.js` for published listings

---

## Usage Notes

### Adding a New Amenity
1. Add entry to relevant property type's `fields` array in config
2. Set `group: "amenities"` and `type: "boolean"` or `type: "number"`
3. Provide multi-language labels
4. Form automatically includes it in pill grid
5. No other code changes needed

### Accessing Amenity Data
**Frontend:**
```javascript
form.attributes.parking // true | false
form.attributes.garage_spots // number
```

**Backend:**
```javascript
listing.attributes.parking
listing.attributes.pool
```

### Custom Amenity Styling
Adjust pill colors in `DynamicFormRenderer`'s `BooleanField` function:
```javascript
if (isAmenity) {
  // Modify className for emerald → custom color
}
```

---

## Files Modified

- `components/propertyTypes.config.js` — Added amenity fields per type
- `components/listing/DynamicFormRenderer.jsx` — Enhanced to render amenities as pills + steppers
- `pages/PostListing.jsx` — Removed static block + updated draft/save logic

## Files Created

- `functions/migrateListingAmenities.js` — Admin utility for published listing migration
- `AMENITIES_MIGRATION.md` — This guide

---

## Support & Troubleshooting

**Q: Old drafts show no amenities**
A: Load the draft in the posting form. The draft loader automatically migrates legacy `features` array to `attributes`. Save once to persist.

**Q: How do I bulk-migrate published listings?**
A: Call `migrateListingAmenities` function via dashboard with each `listing_id`. Or write a batch admin function to loop through all listings of a specific type.

**Q: Can I add custom amenities per listing?**
A: Not via the UI (for now). Amenities are config-driven. To add custom per-listing amenities, add a new text field or free-form array in the property type config.

**Q: What about the old FEATURES_LIST in constants?**
A: It can be removed from `components/constants.js` — it's no longer referenced anywhere. (Optional cleanup)