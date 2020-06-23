'use strict';

const { checkFieldsAreCorrectlyNested } = require('../common-functions');

describe('Common validation functions', () => {
  describe('checkFieldsAreCorrectlyNested', () => {
    const tests = [
      [['name'], true],
      [['name', 'description'], true],
      [['name.firstname'], true],
      [['name.firstname', 'name.lastname'], true],
      [['name.firstname.french'], true],
      [['name.firstname.french', 'firstname'], true],
      [['name.firstname.french', 'french'], true],
      [['name.firstname.french', 'firstname.french'], true],
      [['name', 'name.firstname'], false],
      [['name', 'name.firstname.french'], false],
      [['name.firstname', 'name.firstname.french'], false],
      [[], true],
      [undefined, true],
      [null, true],
      ['', false],
      [3, false],
    ];

    test.each(tests)('%p to be %p', (fields, expectedResult) => {
      const result = checkFieldsAreCorrectlyNested(fields);
      expect(result).toBe(expectedResult);
    });
  });
});
