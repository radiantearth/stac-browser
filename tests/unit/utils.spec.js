import { describe, it, expect } from 'vitest'
import Utils from '../../src/utils.js'

describe('Utils', () => {
  describe('isMediaType', () => {
    it('returns true when type matches single type', () => {
      expect(Utils.isMediaType('image/png', 'image/png')).toBe(true)
    })

    it('returns true when type matches one of array types', () => {
      expect(Utils.isMediaType('image/png', ['image/jpeg', 'image/png'])).toBe(true)
    })

    it('returns false when type does not match', () => {
      expect(Utils.isMediaType('image/gif', ['image/jpeg', 'image/png'])).toBe(false)
    })

    it('handles case-insensitive comparison', () => {
      expect(Utils.isMediaType('IMAGE/PNG', 'image/png')).toBe(true)
    })

    it('returns false for non-string type', () => {
      expect(Utils.isMediaType(123, 'image/png')).toBe(false)
      expect(Utils.isMediaType(null, 'image/png')).toBe(false)
    })

    it('allows empty type when allowEmpty is true', () => {
      expect(Utils.isMediaType('', 'image/png', true)).toBe(true)
      expect(Utils.isMediaType(null, 'image/png', true)).toBe(true)
    })
  })

  describe('shortenTitle', () => {
    it('returns full string when under limit', () => {
      expect(Utils.shortenTitle('short', 10)).toBe('short')
    })

    it('truncates long strings with ellipsis', () => {
      const result = Utils.shortenTitle('this is a very long title', 10)
      expect(result.length).toBe(10)
      expect(result).toContain('…')
    })

    it('uses custom separator', () => {
      const result = Utils.shortenTitle('this is a very long title', 10, '...')
      expect(result).toContain('...')
    })

    it('splits evenly between front and back', () => {
      const result = Utils.shortenTitle('abcdefghij', 5)
      expect(result).toBe('ab…ij')
    })
  })

  describe('removeTrailingSlash', () => {
    it('removes trailing slash', () => {
      expect(Utils.removeTrailingSlash('https://example.com/')).toBe('https://example.com')
    })

    it('leaves non-trailing slash alone', () => {
      expect(Utils.removeTrailingSlash('https://example.com/path')).toBe('https://example.com/path')
    })

    it('handles empty string', () => {
      expect(Utils.removeTrailingSlash('')).toBe('')
    })
  })

  describe('equalUrl', () => {
    it('returns true for identical URLs', () => {
      expect(Utils.equalUrl('https://example.com/path', 'https://example.com/path')).toBe(true)
    })

    it('ignores trailing slashes', () => {
      expect(Utils.equalUrl('https://example.com/path/', 'https://example.com/path')).toBe(true)
    })

    it('returns false for different URLs', () => {
      expect(Utils.equalUrl('https://example.com/a', 'https://example.com/b')).toBe(false)
    })

    it('returns false for invalid URLs', () => {
      expect(Utils.equalUrl('not-a-url', 'also-not')).toBe(false)
    })
  })

  describe('summarizeMd', () => {
    it('removes markdown formatting', () => {
      const result = Utils.summarizeMd('**bold** text')
      expect(result).toBe('bold text')
    })

    it('removes newlines', () => {
      const result = Utils.summarizeMd('line1\nline2\nline3')
      expect(result).toBe('line1 line2 line3')
    })

    it('truncates to maxLength', () => {
      const result = Utils.summarizeMd('this is a longer text', 10)
      expect(result.length).toBe(11) // 10 + ellipsis
      expect(result.endsWith('…')).toBe(true)
    })

    it('returns empty string for empty input', () => {
      expect(Utils.summarizeMd('')).toBe('')
      expect(Utils.summarizeMd(null)).toBe('')
    })
  })

  describe('dateFromUTC / dateToUTC', () => {
    it('dateFromUTC converts UTC to local', () => {
      const utc = new Date('2025-01-15T12:00:00Z')
      const local = Utils.dateFromUTC(utc)
      expect(local).toBeInstanceOf(Date)
    })

    it('dateToUTC converts local to UTC', () => {
      const local = new Date(2025, 0, 15, 12, 0, 0)
      const utc = Utils.dateToUTC(local)
      expect(utc).toBeInstanceOf(Date)
    })

    it('handles null input', () => {
      expect(Utils.dateFromUTC(null)).toBe(null)
      expect(Utils.dateToUTC(null)).toBe(null)
    })
  })

  describe('formatDatetimeQuery', () => {
    it('formats date array to ISO string range', () => {
      const start = new Date('2025-01-01T00:00:00Z')
      const end = new Date('2025-12-31T23:59:59Z')
      const result = Utils.formatDatetimeQuery([start, end])
      expect(result).toContain('/')
      expect(result).toContain('2025-01-01')
      expect(result).toContain('2025-12-31')
    })

    it('uses ".." for missing dates', () => {
      const start = new Date('2025-01-01T00:00:00Z')
      const result = Utils.formatDatetimeQuery([start, null])
      expect(result).toContain('/..')
    })

    it('returns null for empty array', () => {
      expect(Utils.formatDatetimeQuery([null, null])).toBe(null)
    })

    it('returns null for non-array', () => {
      expect(Utils.formatDatetimeQuery('not-array')).toBe(null)
    })
  })

  describe('formatSortbyForPOST', () => {
    it('converts ascending sort', () => {
      const result = Utils.formatSortbyForPOST('datetime')
      expect(result).toEqual([{ field: 'datetime', direction: 'asc' }])
    })

    it('converts descending sort with minus prefix', () => {
      const result = Utils.formatSortbyForPOST('-datetime')
      expect(result).toEqual([{ field: 'datetime', direction: 'desc' }])
    })
  })

  describe('titleForHref', () => {
    it('extracts filename and domain', () => {
      const result = Utils.titleForHref('https://example.com/data/file.json')
      expect(result).toBe('file (example.com)')
    })

    it('recognizes DOI links', () => {
      const result = Utils.titleForHref('https://doi.org/10.1234/example')
      expect(result).toBe('DOI 10.1234/example')
    })

    it('includes domain with common filenames', () => {
      const result = Utils.titleForHref('https://example.com/catalog.json')
      expect(result).toBe('catalog (example.com)')
    })

    it('prefers filename when preferFileName is true', () => {
      const result = Utils.titleForHref('https://example.com/myfile.json', true)
      expect(result).toBe('myfile')
    })
  })

  describe('getValueFromObjectUsingPath', () => {
    it('gets nested value', () => {
      const obj = { a: { b: { c: 'value' } } }
      expect(Utils.getValueFromObjectUsingPath(obj, ['a', 'b', 'c'])).toBe('value')
    })

    it('returns undefined for missing path', () => {
      const obj = { a: 1 }
      expect(Utils.getValueFromObjectUsingPath(obj, ['a', 'b', 'c'])).toBeUndefined()
    })

    it('handles null object', () => {
      expect(Utils.getValueFromObjectUsingPath(null, ['a'])).toBeUndefined()
    })
  })

  describe('search', () => {
    it('finds term in string', () => {
      expect(Utils.search('hello', 'hello world')).toBe(true)
    })

    it('finds term in array', () => {
      expect(Utils.search('hello', ['hello', 'world'])).toBe(true)
    })

    it('finds term in object values', () => {
      expect(Utils.search('hello', { a: 'hello', b: 'world' })).toBe(true)
    })

    it('uses AND logic by default', () => {
      expect(Utils.search('hello world', 'hello world')).toBe(true)
      expect(Utils.search('hello missing', 'hello world')).toBe(false)
    })

    it('uses OR logic when and=false', () => {
      // OR logic: at least one search term must match
      expect(Utils.search('hello', 'hello world', false)).toBe(true)
      expect(Utils.search('goodbye', 'hello world', false)).toBe(false)
    })

    it('is case-insensitive', () => {
      expect(Utils.search('HELLO', 'hello world')).toBe(true)
    })

    it('returns false for empty searchterm', () => {
      expect(Utils.search('', 'hello')).toBe(false)
    })
  })

  describe('mergeDeep', () => {
    it('merges flat objects', () => {
      const result = Utils.mergeDeep({ a: 1 }, { b: 2 })
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it('merges nested objects', () => {
      const result = Utils.mergeDeep(
        { a: { x: 1 } },
        { a: { y: 2 } }
      )
      expect(result).toEqual({ a: { x: 1, y: 2 } })
    })

    it('overwrites non-object values', () => {
      const result = Utils.mergeDeep({ a: 1 }, { a: 2 })
      expect(result).toEqual({ a: 2 })
    })

    it('handles multiple sources', () => {
      const result = Utils.mergeDeep({ a: 1 }, { b: 2 }, { c: 3 })
      expect(result).toEqual({ a: 1, b: 2, c: 3 })
    })
  })

  describe('convertHumanizedSortOrder', () => {
    it('converts asc to 1', () => {
      expect(Utils.convertHumanizedSortOrder('asc')).toBe(1)
    })

    it('converts desc to -1', () => {
      expect(Utils.convertHumanizedSortOrder('desc')).toBe(-1)
    })

    it('returns 0 for unknown', () => {
      expect(Utils.convertHumanizedSortOrder('other')).toBe(0)
    })
  })

  describe('getLinkWithRel', () => {
    const links = [
      { href: 'https://example.com/root', rel: 'root' },
      { href: 'https://example.com/parent', rel: 'parent' },
    ]

    it('finds link by rel', () => {
      const result = Utils.getLinkWithRel(links, 'root')
      expect(result.href).toBe('https://example.com/root')
    })

    it('returns undefined when not found', () => {
      expect(Utils.getLinkWithRel(links, 'child')).toBeUndefined()
    })

    it('returns null for non-array', () => {
      expect(Utils.getLinkWithRel(null, 'root')).toBeNull()
    })
  })

  describe('getLinksWithRels', () => {
    const links = [
      { href: 'https://example.com/next', rel: 'next' },
      { href: 'https://example.com/prev', rel: 'prev' },
      { href: 'https://example.com/root', rel: 'root' },
    ]

    it('finds multiple links by rels', () => {
      const result = Utils.getLinksWithRels(links, ['next', 'prev'])
      expect(result).toHaveLength(2)
    })

    it('returns empty array when none found', () => {
      expect(Utils.getLinksWithRels(links, ['child'])).toEqual([])
    })

    it('returns empty array for non-array', () => {
      expect(Utils.getLinksWithRels(null, ['root'])).toEqual([])
    })
  })
})
