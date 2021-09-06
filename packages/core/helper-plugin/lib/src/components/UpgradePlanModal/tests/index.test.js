import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider, lightTheme } from '@strapi/parts';
import UpgradePlanModal from '../index';

const App = (
  <ThemeProvider theme={lightTheme}>
    <IntlProvider locale="en" messages={{ en: {} }} textComponent="span">
      <UpgradePlanModal isOpen={true} onClose={jest.fn()} />
    </IntlProvider>
  </ThemeProvider>
);

describe('UpgradePlanModal', () => {
  it('renders and matches the snapshot', async () => {
    const {
      container: { firstChild },
    } = render(App);

    expect(firstChild).toMatchInlineSnapshot(`
      .c0 {
        border: 0;
        -webkit-clip: rect(0 0 0 0);
        clip: rect(0 0 0 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
      }

      <div
        class="c0"
      >
        <p
          aria-live="polite"
          id="live-region-log"
          role="log"
        />
        <p
          aria-live="polite"
          id="live-region-status"
          role="status"
        />
        <p
          aria-live="assertive"
          id="live-region-alert"
          role="alert"
        />
      </div>
    `);
  });

  it('renders and matches the snapshot', async () => {
    render(App);

    await waitFor(() => {
      expect(screen.getByText('You have reached the limit')).toBeInTheDocument();
    });
  });
});
