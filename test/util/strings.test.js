// eslint-disable-next-line object-curly-newline
import { describe, it, expect, run } from 'https://gitlab.com/internetarchive/eslint/-/raw/main/test/test.js'

import {
  array_flip, friendly_truncate, killspace,
  ksort, krsort, strip_tags, str_replace, ucwords, vsort, vrsort, map_from_keys,
} from '../../www/js/util/strings.js'


describe('test strings.js', () => {
  it('array_flip', () => {
    const map = {
      x201: 'yah',
      x200: 'wah',
      x202: 'tah',
    }
    expect(array_flip(map)).toEqual({ yah: 'x201', wah: 'x200', tah: 'x202' })
    expect(array_flip(array_flip(map))).toEqual(map)

    const m2 = {
      x201: 'yah',
      x200: 'wah',
      x202: 'yah',
    }
    expect(array_flip(m2)).toEqual({ yah: 'x202', wah: 'x200' })

    const ary = [5, 4, 10]
    expect(array_flip(ary)).toEqual({ 4: '1', 5: '0', 10: '2' })
    expect(array_flip(array_flip(ary))).toEqual({ 0: '5', 1: '4', 2: '10' })

    const a2 = ['three', 'pee', 'oh']
    expect(array_flip(a2)).toEqual({ three: '0', pee: '1', oh: '2' })
    expect(array_flip(array_flip(a2))).toEqual({ 0: 'three', 1: 'pee', 2: 'oh' })
  })

  it('friendly_truncate', () => {
    const str = 'replace input string from arrays of strings to arrays of replacements'
    expect(friendly_truncate(str)).toBe(str)
    expect(friendly_truncate(str, 50)).toBe('replace input string from arrays of strings to...')
    expect(friendly_truncate(str, 10)).toBe('replace...')
    expect(friendly_truncate(str, 6)).toBe('repl..')
    expect(friendly_truncate(str,  6, true)).toBe('repl..')
    expect(friendly_truncate(str, 10, true)).toBe(str)
  })


  it('ksort', () => {
    const map = {
      201: 'yah',
      200: 'wah',
      202: 'tah',
    }
    expect(ksort(map)).toEqual({ 200: 'wah', 201: 'yah', 202: 'tah' })

    const ary = [9, 1, 3, 13, 0]
    expect(ksort(ary)).toEqual({
      0: 9, 1: 1, 2: 3, 3: 13, 4: 0,
    })
  })


  it('krsort', () => {
    const map = {
      201: 'yah',
      200: 'wah',
      202: 'tah',
    }
    expect(krsort(map)).toEqual({ 202: 'tah', 201: 'yah', 200: 'wah' })
  })


  it('vsort', () => {
    const map = {
      '201 ': 'yah',
      '200 ': 'wah',
      '202 ': 'tah',
    }
    expect(vsort(map, 0)).toEqual({ '202 ': 'tah', '200 ': 'wah', '201 ': 'yah' })
    expect(vsort(map, 1)).toEqual({ '201 ': 'yah', '200 ': 'wah', '202 ': 'tah' })
  })


  it('vrsort', () => {
    const map = {
      '201 ': 'yah',
      '200 ': 'wah',
      '202 ': 'tah',
    }
    expect(vrsort(map)).toEqual({ '201 ': 'yah', '200 ': 'wah', '202 ': 'tah' })
  })


  it('str_replace', () => {
    expect(str_replace({ a: 'b', e: 3 }, 'awesoma')).toBe('bw3somb')
  })


  it('strip_tags', () => {
    expect(strip_tags('a b awesoma')).toBe('a b awesoma')
    expect(strip_tags('a <b>b</b> awesoma')).toBe('a b awesoma')
    expect(strip_tags('a <b>b</b> awesoma<span>')).toBe('a b awesoma')
  })


  it('ucwords', () => {
    expect(ucwords(' Hi there folks ')).toBe(' Hi There Folks ')
    expect(ucwords('HI DO')).toBe('Hi Do')
    expect(ucwords('123')).toBe('123')
  })


  it('map_from_keys', () => {
    expect(map_from_keys([])).toEqual({ })
    expect(map_from_keys(['a', 3, 'c'])).toEqual({ a: null, 3: null, c: null })
    expect(map_from_keys(['a', 3, 'c'], 7)).toEqual({ a: 7, 3: 7, c: 7 })
  })


  it('killspace', () => {
    const clean = 'Hi there folks'
    expect(killspace(' Hi there folks ')).toBe(clean)
    expect(killspace('Hi there folks')).toBe(clean)
    expect(killspace(' Hi   there   folks')).toBe(clean)
    expect(killspace(' Hi there   folks  ')).toBe(clean)
    // eslint-disable-next-line no-tabs
    expect(killspace(' Hi	there		folks  	')).toBe(clean)
  })
})

run()
