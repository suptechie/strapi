import prefixFileUrlWithBackendUrl from '../prefixFileUrlWithBackendUrl';

describe('UPLOAD | utils | prefixFileUrlWithBackendUrl', () => {
  it("should add the strapi back-end url if the file's url startsWith '/'", () => {
    const data = '/upload/test';
    const expected = 'http://localhost:1337/upload/test';

    expect(prefixFileUrlWithBackendUrl(data)).toEqual(expected);
  });

  it("should not add the strapi back-end url if the file's url does not start with '/'", () => {
    const data = 'test/upload/test';
    const expected = 'test/upload/test';

    expect(prefixFileUrlWithBackendUrl(data)).toEqual(expected);
  });
});
