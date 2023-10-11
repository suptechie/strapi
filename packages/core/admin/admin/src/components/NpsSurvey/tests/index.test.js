import React from 'react';

import { fireEvent } from '@testing-library/react';
import { render, waitFor, act, server } from '@tests/utils';
import { rest } from 'msw';

import NpsSurvey from '../index';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  auth: {
    getUserInfo: jest.fn(() => ({
      email: 'john@doe.com',
    })),
  },
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const originalLocalStorage = global.localStorage;

describe('NPS survey', () => {
  beforeAll(() => {
    global.localStorage = localStorageMock;
  });

  afterAll(() => {
    global.localStorage = originalLocalStorage;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('renders survey if enabled', () => {
    localStorageMock.getItem.mockReturnValueOnce({ enabled: true });

    const { getByLabelText, getByText } = render(<NpsSurvey />);

    act(() => jest.runAllTimers());

    expect(getByLabelText('0')).toBeInTheDocument();
    expect(getByLabelText('10')).toBeInTheDocument();
    expect(getByText(/not at all likely/i)).toBeInTheDocument();
    expect(getByText(/extremely likely/i)).toBeInTheDocument();
  });

  it("renders survey if settings don't exist", () => {
    localStorageMock.getItem.mockReturnValueOnce(null);

    const { getByLabelText, getByText } = render(<NpsSurvey />);

    act(() => jest.runAllTimers());

    expect(getByLabelText('0')).toBeInTheDocument();
    expect(getByLabelText('10')).toBeInTheDocument();
    expect(getByText(/not at all likely/i)).toBeInTheDocument();
    expect(getByText(/extremely likely/i)).toBeInTheDocument();
  });

  it('does not render survey if disabled', () => {
    localStorageMock.getItem.mockReturnValueOnce({ enabled: false });
    const { queryByText } = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(queryByText(/not at all likely/i)).not.toBeInTheDocument();
  });

  it('saves user response', async () => {
    localStorageMock.getItem.mockReturnValueOnce({ enabled: true });

    const { getByRole, queryByText } = render(<NpsSurvey />);

    act(() => jest.runAllTimers());

    fireEvent.click(getByRole('radio', { name: '10' }));

    expect(getByRole('button', { name: /submit feedback/i })).toBeInTheDocument();

    fireEvent.submit(getByRole('form'));

    await waitFor(() => expect(queryByText(/not at all likely/i)).not.toBeInTheDocument());

    expect(queryByText(/thank you very much for your feedback!/i)).toBeInTheDocument();

    const storedData = JSON.parse(localStorageMock.setItem.mock.calls.at(-1).at(1));
    expect(storedData).toEqual({
      enabled: true,
      lastResponseDate: expect.any(String),
      firstDismissalDate: null,
      lastDismissalDate: null,
    });
    expect(new Date(storedData.lastResponseDate)).toBeInstanceOf(Date);
  });

  it('show error message if request fails and keep survey open', async () => {
    const originalError = console.error;
    console.error = jest.fn();

    localStorageMock.getItem.mockReturnValueOnce({ enabled: true });

    server.use(
      rest.post('https://analytics.strapi.io/submit-nps', (req, res, ctx) => {
        return res.once(ctx.status(500));
      })
    );

    const { getByRole, queryByText, getByText } = render(<NpsSurvey />);

    act(() => jest.runAllTimers());

    fireEvent.click(getByRole('radio', { name: '10' }));

    expect(getByRole('button', { name: /submit feedback/i })).toBeInTheDocument();

    fireEvent.submit(getByRole('form'));

    await waitFor(() => expect(queryByText(/not at all likely/i)).toBeInTheDocument());

    expect(queryByText(/thank you very much for your feedback!/i)).not.toBeInTheDocument();

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await waitFor(() => expect(getByText('An error occurred')).toBeInTheDocument());

    console.error = originalError;
  });

  it('saves first user dismissal', async () => {
    localStorageMock.getItem.mockReturnValueOnce({ enabled: true });

    const { queryByText, user, getByRole } = render(<NpsSurvey />);

    act(() => {
      jest.runAllTimers();
      /**
       * If I don't do this, the test never runs
       */
      jest.useRealTimers();
    });

    await user.click(getByRole('button', { name: 'Dismiss survey' }));

    expect(queryByText(/not at all likely/i)).not.toBeInTheDocument();

    const storedData = JSON.parse(localStorageMock.setItem.mock.calls.at(-1).at(1));
    expect(storedData).toEqual({
      enabled: true,
      lastResponseDate: null,
      firstDismissalDate: expect.any(String),
    });
    expect(new Date(storedData.firstDismissalDate)).toBeInstanceOf(Date);
  });

  it('saves subsequent user dismissal', async () => {
    const firstDismissalDate = '2000-07-20T09:28:51.963Z';
    localStorageMock.getItem.mockReturnValueOnce({
      enabled: true,
      firstDismissalDate,
    });

    const { user, queryByText, getByText } = render(<NpsSurvey />);

    act(() => {
      jest.runAllTimers();
      /**
       * If I don't do this, the test never runs
       */
      jest.useRealTimers();
    });

    await user.click(getByText(/dismiss survey/i));
    expect(queryByText(/not at all likely/i)).not.toBeInTheDocument();

    const storedData = JSON.parse(localStorageMock.setItem.mock.calls.at(-1).at(1));
    expect(storedData).toEqual({
      enabled: true,
      lastResponseDate: null,
      firstDismissalDate,
      lastDismissalDate: expect.any(String),
    });
    expect(new Date(storedData.lastDismissalDate)).toBeInstanceOf(Date);
  });

  it('respects the delay after user submission', () => {
    const initialDate = new Date('2020-01-01');
    const withinDelay = new Date('2020-01-31');
    const beyondDelay = new Date('2020-03-31');

    localStorageMock.getItem.mockReturnValue({ enabled: true, lastResponseDate: initialDate });

    jest.setSystemTime(initialDate);

    // Survey should not show up right after submission
    const render1 = render(<NpsSurvey />);
    act(() => {
      jest.runAllTimers();
    });
    expect(render1.queryByText(/not at all likely/i)).not.toBeInTheDocument();

    // Survey should not show up during delay
    jest.advanceTimersByTime(withinDelay - initialDate);
    const render2 = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(render2.queryByText(/not at all likely/i)).not.toBeInTheDocument();

    // Survey should show up again after delay
    jest.advanceTimersByTime(beyondDelay - withinDelay);
    const render3 = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(render3.getByText(/not at all likely/i)).toBeInTheDocument();
  });

  it('respects the delay after first user dismissal', async () => {
    const initialDate = new Date('2020-01-01');
    const withinDelay = new Date('2020-01-04');
    const beyondDelay = new Date('2020-01-08');

    localStorageMock.getItem.mockReturnValue({
      enabled: true,
      firstDismissalDate: initialDate,
      lastDismissalDate: null,
      lastResponseDate: null,
    });

    jest.setSystemTime(initialDate);

    // Survey should not show up right after dismissal
    const render1 = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(render1.queryByText(/not at all likely/i)).not.toBeInTheDocument();

    // Survey should not show up during delay
    jest.advanceTimersByTime(withinDelay - initialDate);
    const render2 = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(render2.queryByText(/not at all likely/i)).not.toBeInTheDocument();

    // Survey should show up again after delay
    jest.advanceTimersByTime(beyondDelay - withinDelay);
    const render3 = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(render3.getByText(/not at all likely/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('respects the delay after subsequent user dismissal', async () => {
    const initialDate = new Date('2020-01-01');
    const withinDelay = new Date('2020-03-30');
    const beyondDelay = new Date('2020-04-01');

    localStorageMock.getItem.mockReturnValue({
      enabled: true,
      firstDismissalDate: initialDate,
      lastDismissalDate: initialDate,
      lastResponseDate: null,
    });

    jest.setSystemTime(initialDate);

    // Survey should not show up right after dismissal
    const render1 = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(render1.queryByText(/not at all likely/i)).not.toBeInTheDocument();

    // Survey should not show up during delay
    jest.advanceTimersByTime(withinDelay - initialDate);
    const render2 = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(render2.queryByText(/not at all likely/i)).not.toBeInTheDocument();

    // Survey should show up again after delay
    jest.advanceTimersByTime(beyondDelay - withinDelay);
    const render3 = render(<NpsSurvey />);
    act(() => jest.runAllTimers());
    expect(render3.getByText(/not at all likely/i)).toBeInTheDocument();
  });
});
