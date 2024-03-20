import { renderHook } from '@tests/utils';
import { AxiosError, AxiosHeaders } from 'axios';

import { useAPIErrorHandler, ApiError } from '../useAPIErrorHandler';

describe('useAPIErrorHandler', () => {
  class Err extends AxiosError<{ error: ApiError }> {
    constructor(error: ApiError) {
      super(
        undefined,
        undefined,
        undefined,
        {},
        {
          statusText: 'Bad Request',
          status: 400,
          headers: new AxiosHeaders(),
          config: {
            headers: new AxiosHeaders(),
          },
          data: {
            error,
          },
        }
      );
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('exports formatAPIError()', async () => {
    const { result } = renderHook(() => useAPIErrorHandler());

    expect(typeof result.current.formatAPIError).toBe('function');
  });

  test('formats a single API error', async () => {
    const { result } = renderHook(() => useAPIErrorHandler());

    const message = result.current.formatAPIError(
      new Err({
        name: 'ApplicationError',
        message: 'Field contains errors',
        details: {},
      })
    );

    expect(message).toBe('Field contains errors');
  });

  test('formats an API error containing multiple errors', async () => {
    const { result } = renderHook(() => useAPIErrorHandler());

    const message = result.current.formatAPIError(
      new Err({
        name: 'ValidationError',
        message: '',
        details: {
          errors: [
            {
              path: ['field', '0', 'name'],
              message: 'Field contains errors',
            },

            {
              path: ['field'],
              message: 'Field must be unique',
            },
          ],
        },
      })
    );

    expect(message).toBe('Field contains errors\nField must be unique');
  });

  test('formats AxiosErrors', async () => {
    const { result } = renderHook(() => useAPIErrorHandler());

    const axiosError = new AxiosError(
      'Error message',
      '409',
      undefined,
      {},
      // @ts-expect-error – we're testing that it can handle axios errors
      {
        status: 405,
        data: { message: 'Error message' },
      }
    );

    // @ts-expect-error – we're testing that it can handle axios errors
    const message = result.current.formatAPIError(axiosError);

    expect(message).toBe('Error message');
  });
});
