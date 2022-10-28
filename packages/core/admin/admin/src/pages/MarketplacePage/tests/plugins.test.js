import React from 'react';
import {
  render,
  waitFor,
  waitForElementToBeRemoved,
  getByPlaceholderText,
  screen,
  getByText,
  queryByText,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, lightTheme } from '@strapi/design-system';

import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';

import MarketPlacePage from '../index';
import server from './server';

// Increase the jest timeout to accommodate long running tests
jest.setTimeout(30000);
const toggleNotification = jest.fn();
jest.mock('../../../hooks/useNavigatorOnLine', () => jest.fn(() => true));
jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useNotification: jest.fn(() => {
    return toggleNotification;
  }),
  pxToRem: jest.fn(),
  CheckPagePermissions: ({ children }) => children,
  useTracking: jest.fn(() => ({ trackUsage: jest.fn() })),
  useAppInfos: jest.fn(() => ({
    autoReload: true,
    dependencies: {
      '@strapi/plugin-documentation': '4.2.0',
      '@strapi/provider-upload-cloudinary': '4.2.0',
    },
    useYarn: true,
  })),
}));

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const waitForReload = async () => {
  await waitForElementToBeRemoved(() => screen.getByTestId('loader'));
  await waitFor(() =>
    expect(screen.getByRole('heading', { name: /marketplace/i })).toBeInTheDocument()
  );
};

describe('Plugins tab', () => {
  let renderedContainer;
  let history;

  beforeAll(() => server.listen());

  afterEach(() => {
    server.resetHandlers();
    // Clear the cache to isolate each test
    client.clear();
  });

  afterAll(() => server.close());

  beforeEach(async () => {
    history = createMemoryHistory();
    // Make sure each test isolated
    const { container } = render(
      <QueryClientProvider client={client}>
        <IntlProvider locale="en" messages={{}} textComponent="span">
          <ThemeProvider theme={lightTheme}>
            <Router history={history}>
              <MarketPlacePage />
            </Router>
          </ThemeProvider>
        </IntlProvider>
      </QueryClientProvider>
    );

    await waitForReload();

    renderedContainer = container;
  });

  it('renders and matches the plugin tab snapshot', async () => {
    // Check snapshot
    expect(renderedContainer.firstChild).toMatchSnapshot();

    // Make sure it defaults to the plugins tab
    const button = screen.getByRole('tab', { selected: true });
    const pluginsTabActive = getByText(button, /plugins/i);

    const tabPanel = screen.getByRole('tabpanel');
    const pluginCardText = getByText(tabPanel, 'Comments');
    const providerCardText = queryByText(tabPanel, 'Cloudinary');
    const submitPluginText = screen.queryByText('Submit plugin');

    expect(pluginsTabActive).not.toBe(null);
    expect(pluginCardText).toBeVisible();
    expect(submitPluginText).toBeVisible();
    expect(providerCardText).toEqual(null);
  });

  it('should return plugin search results matching the query', () => {
    const input = getByPlaceholderText(renderedContainer, 'Search');
    userEvent.type(input, 'comment');
    const match = screen.getByText('Comments');
    const notMatch = screen.queryByText('Sentry');
    const provider = screen.queryByText('Cloudinary');

    expect(match).toBeVisible();
    expect(notMatch).toEqual(null);
    expect(provider).toEqual(null);
  });

  it('should return empty plugin search results given a bad query', () => {
    const input = getByPlaceholderText(renderedContainer, 'Search');
    const badQuery = 'asdf';
    userEvent.type(input, badQuery);
    const noResult = screen.getByText(`No result for "${badQuery}"`);

    expect(noResult).toBeVisible();
  });

  it('shows the installed text for installed plugins', () => {
    // Plugin that's already installed
    const alreadyInstalledCard = screen
      .getAllByTestId('npm-package-card')
      .find((div) => div.innerHTML.includes('Documentation'));
    const alreadyInstalledText = queryByText(alreadyInstalledCard, /installed/i);
    expect(alreadyInstalledText).toBeVisible();

    // Plugin that's not installed
    const notInstalledCard = screen
      .getAllByTestId('npm-package-card')
      .find((div) => div.innerHTML.includes('Comments'));
    const notInstalledText = queryByText(notInstalledCard, /copy install command/i);
    expect(notInstalledText).toBeVisible();
  });

  it('shows plugins filters popover', () => {
    const filtersButton = screen.getByRole('button', { name: /filters/i });

    userEvent.click(filtersButton);
    const collectionsButton = screen.getByRole('button', { name: 'No collections selected' });
    const categoriesButton = screen.getByRole('button', { name: 'No categories selected' });

    expect(collectionsButton).toBeVisible();
    expect(categoriesButton).toBeVisible();
  });

  it('shows the collections filter options', () => {
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    userEvent.click(filtersButton);

    const collectionsButton = screen.getByRole('button', { name: 'No collections selected' });

    userEvent.click(collectionsButton);

    const mockedServerCollections = {
      'Made by official partners': 9,
      'Made by Strapi': 13,
      'Made by the community': 69,
      Verified: 29,
    };

    Object.entries(mockedServerCollections).forEach(([collectionName, count]) => {
      const option = screen.getByRole('option', { name: `${collectionName} (${count})` });
      expect(option).toBeVisible();
    });
  });

  it('shows the categories filter options', () => {
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    userEvent.click(filtersButton);

    const categoriesButton = screen.getByRole('button', { name: 'No categories selected' });

    userEvent.click(categoriesButton);

    const mockedServerCategories = {
      'Custom fields': 4,
      Deployment: 2,
      Monitoring: 1,
    };

    Object.entries(mockedServerCategories).forEach(([categoryName, count]) => {
      const option = screen.getByRole('option', { name: `${categoryName} (${count})` });
      expect(option).toBeVisible();
    });
  });

  it('filters a collection option', async () => {
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    userEvent.click(filtersButton);

    const collectionsButton = screen.getByRole('button', { name: 'No collections selected' });
    userEvent.click(collectionsButton);

    const option = screen.getByRole('option', { name: `Made by Strapi (13)` });
    userEvent.click(option);

    await waitForReload();

    const optionTag = screen.getByRole('button', { name: 'Made by Strapi' });
    expect(optionTag).toBeVisible();

    const collectionCards = screen.getAllByTestId('npm-package-card');
    expect(collectionCards.length).toEqual(2);

    const collectionPlugin = screen.getByText('Gatsby Preview');
    const notCollectionPlugin = screen.queryByText('Comments');
    expect(collectionPlugin).toBeVisible();
    expect(notCollectionPlugin).toEqual(null);
  });

  it('filters a category option', async () => {
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    userEvent.click(filtersButton);

    const categoriesButton = screen.getByRole('button', { name: 'No categories selected' });
    userEvent.click(categoriesButton);

    const option = screen.getByRole('option', { name: `Custom fields (4)` });
    userEvent.click(option);

    await waitForReload();

    const optionTag = screen.getByRole('button', { name: 'Custom fields' });
    expect(optionTag).toBeVisible();

    const categoryCards = screen.getAllByTestId('npm-package-card');
    expect(categoryCards.length).toEqual(2);

    const categoryPlugin = screen.getByText('CKEditor 5 custom field');
    const notCategoryPlugin = screen.queryByText('Comments');
    expect(categoryPlugin).toBeVisible();
    expect(notCategoryPlugin).toEqual(null);
  });

  // filters collections and categories together
  it('filters a category and a collection option', async () => {
    // When a user clicks the filters button
    userEvent.click(screen.getByRole('button', { name: /filters/i }));
    // They should see a select button for collections with no options selected
    const collectionsButton = screen.getByRole('button', { name: 'No collections selected' });
    // When they click the select button
    userEvent.click(collectionsButton);
    // They should see a Made by Strapi option
    const collectionOption = screen.getByRole('option', { name: `Made by Strapi (13)` });
    // When they click the option
    userEvent.click(collectionOption);
    // The page should reload
    await waitForReload();
    // When they click the filters button again
    userEvent.click(screen.getByRole('button', { name: 'Filters' }));
    // They should see the collections button indicating 1 option selected
    userEvent.click(screen.getByRole('button', { name: '1 collection selected Made by Strapi' }));
    // They should the categories button with no options selected
    const categoriesButton = screen.getByRole('button', { name: 'No categories selected' });
    userEvent.click(categoriesButton);
    const categoryOption = screen.getByRole('option', { name: `Custom fields (4)` });
    userEvent.click(categoryOption);
    // The page should reload
    await waitForReload();
    // When the page reloads they should see a tag for the selected option
    const madeByStrapiTag = screen.getByRole('button', { name: 'Made by Strapi' });
    const customFieldsTag = screen.getByRole('button', { name: 'Custom fields' });
    expect(madeByStrapiTag).toBeVisible();
    expect(customFieldsTag).toBeVisible();
    // They should see the correct number of results
    const filterCards = screen.getAllByTestId('npm-package-card');
    expect(filterCards.length).toEqual(4);
    // They should see the collection option results
    const collectionPlugin = screen.getByText('Gatsby Preview');
    const notCollectionPlugin = screen.queryByText('Comments');
    expect(collectionPlugin).toBeVisible();
    expect(notCollectionPlugin).toEqual(null);
    // They should see the category option results
    const categoryPlugin = screen.getByText('CKEditor 5 custom field');
    const notCategoryPlugin = screen.queryByText('Config Sync');
    expect(categoryPlugin).toBeVisible();
    expect(notCategoryPlugin).toEqual(null);
  });

  it('filters multiple collection options', async () => {
    userEvent.click(screen.getByRole('button', { name: /filters/i }));
    userEvent.click(screen.getByRole('button', { name: 'No collections selected' }));
    userEvent.click(screen.getByRole('option', { name: `Made by Strapi (13)` }));

    await waitForReload();

    userEvent.click(screen.getByRole('button', { name: /filters/i }));
    userEvent.click(screen.getByRole('button', { name: `1 collection selected Made by Strapi` }));
    userEvent.click(screen.getByRole('option', { name: `Verified (29)` }));

    await waitForReload();

    const madeByStrapiTag = screen.getByRole('button', { name: 'Made by Strapi' });
    const verifiedTag = screen.getByRole('button', { name: 'Verified' });
    expect(madeByStrapiTag).toBeVisible();
    expect(verifiedTag).toBeVisible();
    expect(screen.getAllByTestId('npm-package-card').length).toEqual(3);
    expect(screen.getByText('Gatsby Preview')).toBeVisible();
    expect(screen.getByText('Config Sync')).toBeVisible();
    expect(screen.queryByText('Comments')).toEqual(null);
  });

  it('filters multiple category options', async () => {
    userEvent.click(screen.getByRole('button', { name: /filters/i }));
    userEvent.click(screen.getByRole('button', { name: 'No categories selected' }));
    userEvent.click(screen.getByRole('option', { name: `Custom fields (4)` }));

    await waitForReload();

    userEvent.click(screen.getByRole('button', { name: /filters/i }));
    userEvent.click(screen.getByRole('button', { name: `1 category selected Custom fields` }));
    userEvent.click(screen.getByRole('option', { name: `Monitoring (1)` }));

    await waitForReload();

    const customFieldsTag = screen.getByRole('button', { name: 'Custom fields' });
    const monitoringTag = screen.getByRole('button', { name: 'Monitoring' });
    expect(customFieldsTag).toBeVisible();
    expect(monitoringTag).toBeVisible();
    expect(screen.getAllByTestId('npm-package-card').length).toEqual(3);
    expect(screen.getByText('CKEditor 5 custom field')).toBeVisible();
    expect(screen.getByText('Sentry')).toBeVisible();
    expect(screen.queryByText('Comments')).toEqual(null);
  });

  it('removes a filter option tag', async () => {
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    userEvent.click(filtersButton);

    const collectionsButton = screen.getByRole('button', { name: 'No collections selected' });
    userEvent.click(collectionsButton);

    const option = screen.getByRole('option', { name: `Made by Strapi (13)` });
    userEvent.click(option);

    await waitForReload();

    const optionTag = screen.getByRole('button', { name: 'Made by Strapi' });
    expect(optionTag).toBeVisible();

    userEvent.click(optionTag);

    expect(optionTag).not.toBeVisible();
    expect(history.location.search).toBe('');
  });

  it('only filters in the plugins tab', async () => {
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    userEvent.click(filtersButton);

    const collectionsButton = screen.getByRole('button', { name: 'No collections selected' });
    userEvent.click(collectionsButton);

    const option = screen.getByRole('option', { name: `Made by Strapi (13)` });
    userEvent.click(option);

    await waitForReload();

    const collectionCards = screen.getAllByTestId('npm-package-card');
    expect(collectionCards.length).toBe(2);

    userEvent.click(screen.getByRole('tab', { name: /providers/i }));

    const providerCards = screen.getAllByTestId('npm-package-card');
    expect(providerCards.length).toBe(9);

    userEvent.click(screen.getByRole('tab', { name: /plugins/i }));
    expect(collectionCards.length).toBe(2);
  });
});
