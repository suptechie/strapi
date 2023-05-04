import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import { IntlProvider } from 'react-intl';
import BulkActionsBar from '../index';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useTracking: () => ({
    trackUsage: jest.fn(),
  }),
}));

jest.mock('../../../../../shared/hooks', () => ({
  ...jest.requireActual('../../../../../shared/hooks'),
  useInjectionZone: () => [],
}));

const user = userEvent.setup();

describe('BulkActionsBar', () => {
  const requiredProps = {
    selectedEntries: [],
    clearSelectedEntries: jest.fn(),
  };

  const TestComponent = (props) => (
    <ThemeProvider theme={lightTheme}>
      <IntlProvider locale="en" messages={{}} defaultLocale="en">
        <BulkActionsBar {...requiredProps} {...props} />
      </IntlProvider>
    </ThemeProvider>
  );

  const setup = (props) => render(<TestComponent {...props} />);

  it('should render publish buttons if showPublish is true', () => {
    setup({ showPublish: true });

    expect(screen.getByRole('button', { name: /\bPublish\b/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\bUnpublish\b/ })).toBeInTheDocument();
  });

  it('should not render publish buttons if showPublish is false', () => {
    setup({ showPublish: false });

    expect(screen.queryByRole('button', { name: /\bPublish\b/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\bUnpublish\b/ })).not.toBeInTheDocument();
  });

  it('should render delete button if showDelete is true', () => {
    setup({ showDelete: true });

    expect(screen.getByRole('button', { name: /\bDelete\b/ })).toBeInTheDocument();
  });

  it('should not render delete button if showDelete is false', () => {
    setup({ showDelete: false });

    expect(screen.queryByRole('button', { name: /\bDelete\b/ })).not.toBeInTheDocument();
  });

  it('should show delete modal if delete button is clicked', async () => {
    setup({ showDelete: true });

    await userEvent.click(screen.getByRole('button', { name: /\bDelete\b/ }));

    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });

  it('should call confirm delete all if confirmation button is clicked', async () => {
    const mockConfirmDeleteAll = jest.fn();

    setup({
      showDelete: true,
      onConfirmDeleteAll: mockConfirmDeleteAll,
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /\bDelete\b/ }));
      await user.click(screen.getByRole('button', { name: /confirm/i }));
    });

    expect(mockConfirmDeleteAll).toHaveBeenCalledWith([]);
  });

  it('should show publish modal if publish button is clicked', async () => {
    setup({ showPublish: true });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /\bpublish\b/i }));
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: /\bpublish\b/i })
      );
    });

    expect(screen.getByText(/Are you sure you want to publish these entries?/)).toBeVisible();
  });

  it('should show unpublish modal if unpublish button is clicked', async () => {
    setup({ showPublish: true });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /\bunpublish\b/i }));
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', { name: /\bunpublish\b/i })
      );
    });

    expect(screen.getByText(/Are you sure you want to unpublish these entries?/)).toBeVisible();
  });
});
