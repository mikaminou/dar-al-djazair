import { describe, it, expect } from 'vitest';
import { encodeFiltersToUrl, decodeFiltersFromUrl } from '../urlFilterState';

describe('encodeFiltersToUrl', () => {
  it('returns an empty string for empty filters with default sort/view', () => {
    expect(encodeFiltersToUrl({}, '-created_date', 'grid')).toBe('');
  });

  it('encodes universal filters with their short URL keys', () => {
    const qs = encodeFiltersToUrl(
      { listing_type: 'sale', property_type: 'house', wilaya: 'Alger', min_price: 1000 },
      '-created_date',
      'grid'
    );
    const params = new URLSearchParams(qs);
    expect(params.get('type')).toBe('sale');
    expect(params.get('pt')).toBe('house');
    expect(params.get('w')).toBe('Alger');
    expect(params.get('min_price')).toBe('1000');
  });

  it('prefixes dynamic attributes with "attr_"', () => {
    const qs = encodeFiltersToUrl(
      { bedrooms: 3, buildable: true },
      '-created_date',
      'grid'
    );
    const params = new URLSearchParams(qs);
    expect(params.get('attr_bedrooms')).toBe('3');
    expect(params.get('attr_buildable')).toBe('true');
  });

  it('joins array values with commas under attr_features', () => {
    const qs = encodeFiltersToUrl(
      { features: ['parking', 'pool'] },
      '-created_date',
      'grid'
    );
    expect(new URLSearchParams(qs).get('attr_features')).toBe('parking,pool');
  });

  it('omits non-default sort/view explicitly, includes when non-default', () => {
    const qsDefault = encodeFiltersToUrl({}, '-created_date', 'grid');
    expect(qsDefault).toBe('');

    const qsCustom = encodeFiltersToUrl({}, 'price', 'list');
    const params = new URLSearchParams(qsCustom);
    expect(params.get('sort')).toBe('price');
    expect(params.get('view')).toBe('list');
  });

  it('drops empty / null / empty-array values', () => {
    const qs = encodeFiltersToUrl(
      { listing_type: '', wilaya: null, features: [], bedrooms: undefined },
      '-created_date',
      'grid'
    );
    expect(qs).toBe('');
  });
});

describe('decodeFiltersFromUrl', () => {
  it('returns sensible defaults for an empty search string', () => {
    expect(decodeFiltersFromUrl('')).toEqual({
      filters: {},
      sort: '-created_date',
      view: 'grid',
    });
  });

  it('decodes universal filters back to their long names', () => {
    const out = decodeFiltersFromUrl('?type=sale&pt=house&w=Alger&min_price=1000');
    expect(out.filters).toEqual({
      listing_type: 'sale',
      property_type: 'house',
      wilaya: 'Alger',
      min_price: '1000',
    });
  });

  it('rejects invalid listing_type / property_type values', () => {
    const out = decodeFiltersFromUrl('?type=bogus&pt=spaceship');
    expect(out.filters).toEqual({});
  });

  it('decodes attr_* params back into the filter object', () => {
    const out = decodeFiltersFromUrl('?attr_bedrooms=3&attr_buildable=true');
    expect(out.filters.bedrooms).toBe('3');
    expect(out.filters.buildable).toBe('true');
  });

  it('splits attr_features back into an array', () => {
    const out = decodeFiltersFromUrl('?attr_features=parking,pool');
    expect(out.filters.features).toEqual(['parking', 'pool']);
  });

  it('respects valid view values, ignores invalid ones', () => {
    expect(decodeFiltersFromUrl('?view=list').view).toBe('list');
    expect(decodeFiltersFromUrl('?view=hologram').view).toBe('grid');
  });

  it('passes any sort string through', () => {
    expect(decodeFiltersFromUrl('?sort=price').sort).toBe('price');
  });
});

describe('encode → decode round-trip', () => {
  it('preserves filter state', () => {
    const filters = {
      listing_type: 'rent',
      property_type: 'apartment',
      wilaya: 'Oran',
      min_price: '500',
      max_price: '2000',
      bedrooms: '2',
      furnished: 'furnished',
      features: ['parking', 'elevator'],
    };
    const qs = encodeFiltersToUrl(filters, 'price', 'list');
    const out = decodeFiltersFromUrl('?' + qs);

    expect(out.sort).toBe('price');
    expect(out.view).toBe('list');
    expect(out.filters.listing_type).toBe('rent');
    expect(out.filters.property_type).toBe('apartment');
    expect(out.filters.wilaya).toBe('Oran');
    expect(out.filters.min_price).toBe('500');
    expect(out.filters.max_price).toBe('2000');
    expect(out.filters.bedrooms).toBe('2');
    expect(out.filters.furnished).toBe('furnished');
    expect(out.filters.features).toEqual(['parking', 'elevator']);
  });
});