import {test, expect, describe} from '@jest/globals'

import Utils from '../src/utils';

describe('Utils.size', () => {
  test('When supplied a valid array size is calculated correctly', () => {
    expect(Utils.size([1, 2, 3])).toBe(3);
  });

  test('When supplied a valid map is calculated correctly', () => {
    expect(Utils.size({a: 1, b:2})).toBe(2);
  });
  test('When supplied a argument that is neither an array or a map a value of zero is returned ', () => {
    expect(Utils.size(1)).toBe(0);
  });
});
