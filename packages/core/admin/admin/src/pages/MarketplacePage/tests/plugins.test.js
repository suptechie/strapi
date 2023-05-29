import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import { TrackingProvider } from '@strapi/helper-plugin';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import MarketPlacePage from '../index';
import server from './server';

// Increase the jest timeout to accommodate long running tests
jest.setTimeout(50000);
const toggleNotification = jest.fn();
jest.mock('../../../hooks/useNavigatorOnLine', () => jest.fn(() => true));
jest.mock('../../../hooks/useDebounce', () => (value) => value);
jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useNotification: jest.fn(() => {
    return toggleNotification;
  }),
  CheckPagePermissions: ({ children }) => children,
  useAppInfo: jest.fn(() => ({
    autoReload: true,
    dependencies: {
      '@strapi/plugin-documentation': '4.2.0',
      '@strapi/provider-upload-cloudinary': '4.2.0',
    },
    useYarn: true,
  })),
}));

const user = userEvent.setup();

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const waitForReload = async () => {
  await screen.findByTestId('marketplace-results');
};

describe('Marketplace page - plugins tab', () => {
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
    render(
      <QueryClientProvider client={client}>
        <TrackingProvider>
          <IntlProvider locale="en" messages={{}} textComponent="span">
            <ThemeProvider theme={lightTheme}>
              <Router history={history}>
                <MarketPlacePage />
              </Router>
            </ThemeProvider>
          </IntlProvider>
        </TrackingProvider>
      </QueryClientProvider>
    );

    await waitForReload();
  });

  it('renders the plugins tab', async () => {
    // Make sure it defaults to the plugins tab
    const button = screen.getByRole('tab', { selected: true });
    const pluginsTabActive = within(button).getByText(/plugins/i);

    const pluginCardText = screen.getByText('Comments');
    const providerCardText = screen.queryByText('Cloudinary');
    const submitPluginText = screen.queryByText('Submit plugin');

    expect(pluginsTabActive).not.toBe(null);
    expect(pluginCardText).toBeVisible();
    expect(submitPluginText).toBeVisible();
    expect(providerCardText).toEqual(null);
  });

  it('should return plugin search results matching the query', async () => {
    const input = screen.getByPlaceholderText('Search');

    await user.type(input, 'comment');
    await waitForReload();

    const match = screen.getByText('Comments');
    const notMatch = screen.queryByText('Sentry');
    const provider = screen.queryByText('Cloudinary');

    expect(match).toBeVisible();
    expect(notMatch).toEqual(null);
    expect(provider).toEqual(null);
  });

  it('should return empty plugin search results given a bad query', async () => {
    const input = screen.getByPlaceholderText('Search');
    const badQuery = 'asdf';
    await user.type(input, badQuery);
    await waitForReload();

    const noResult = screen.getByText(`No result for "${badQuery}"`);
    expect(noResult).toBeVisible();
  });

  it('shows the installed text for installed plugins', () => {
    // Plugin that's already installed
    const alreadyInstalledCard = screen
      .getAllByTestId('npm-package-card')
      .find((div) => div.innerHTML.includes('Documentation'));
    const alreadyInstalledText = within(alreadyInstalledCard).queryByText(/installed/i);
    expect(alreadyInstalledText).toBeVisible();

    // Plugin that's not installed
    const notInstalledCard = screen
      .getAllByTestId('npm-package-card')
      .find((div) => div.innerHTML.includes('Comments'));
    const notInstalledText = within(notInstalledCard).queryByText(/copy install command/i);
    expect(notInstalledText).toBeVisible();
  });

  it('shows plugins filters popover', async () => {
    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    const collectionsButton = screen.getByRole('combobox', { name: 'Collections' });
    const categoriesButton = screen.getByRole('combobox', { name: 'Categories' });

    expect(collectionsButton).toBeVisible();
    expect(categoriesButton).toBeVisible();
  });

  it('shows the collections filter options', async () => {
    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    const collectionsButton = screen.getByRole('combobox', { name: 'Collections' });
    await user.click(collectionsButton);

    const mockedServerCollections = {
      'Made by official partners': 9,
      'Made by Strapi': 13,
      'Made by the community': 69,
      Verified: 29,
    };

    Object.entries(mockedServerCollections).forEach(([collectionName, count]) => {
      const option = screen.getByTestId(`${collectionName}-${count}`);
      expect(option).toBeVisible();
    });
  });

  it('shows the categories filter options', async () => {
    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    const categoriesButton = screen.getByRole('combobox', { name: 'Categories' });
    await user.click(categoriesButton);

    const mockedServerCategories = {
      'Custom fields': 4,
      Deployment: 2,
      Monitoring: 1,
    };

    Object.entries(mockedServerCategories).forEach(([categoryName, count]) => {
      const option = screen.getByTestId(`${categoryName}-${count}`);
      expect(option).toBeVisible();
    });
  });

  it('filters a collection option', async () => {
    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    const collectionsButton = screen.getByRole('combobox', { name: 'Collections' });
    await user.click(collectionsButton);

    const option = screen.getByTestId('Made by Strapi-13');
    await user.click(option);
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');
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
    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    const categoriesButton = screen.getByRole('combobox', { name: 'Categories' });
    await user.click(categoriesButton);

    const option = screen.getByTestId('Custom fields-4');
    await user.click(option);
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');
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

  it('filters a category and a collection option', async () => {
    // When a user clicks the filters button
    await user.click(screen.getByTestId('filters-button'));
    // They should see a select button for collections with no options selected
    const collectionsButton = screen.getByRole('combobox', { name: 'Collections' });
    // When they click the select button
    await user.click(collectionsButton);
    // They should see a Made by Strapi option
    const collectionOption = screen.getByTestId('Made by Strapi-13');
    // When they click the option
    await user.click(collectionOption);
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');
    await user.click(screen.getByTestId('filters-button'));
    // They should see the collections button indicating 1 option selected
    expect(screen.getByRole('combobox', { name: 'Collections' })).toHaveTextContent(
      '1 collection selected'
    );
    // They should the categories button with no options selected
    const categoriesButton = screen.getByRole('combobox', { name: 'Categories' });
    await user.click(categoriesButton);
    const categoryOption = screen.getByTestId('Custom fields-4');
    await user.click(categoryOption);
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');
    // When the page reloads they should see a tag for the selected option
    await waitForReload();
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
    await user.click(screen.getByTestId('filters-button'));
    await user.click(screen.getByRole('combobox', { name: 'Collections' }));
    await user.click(screen.getByTestId('Made by Strapi-13'));
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');

    await waitForReload();

    await user.click(screen.getByTestId('filters-button'));
    await user.click(screen.getByRole('combobox', { name: `Collections` }));
    await user.click(screen.getByRole('option', { name: `Verified (29)` }));
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');

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
    await user.click(screen.getByTestId('filters-button'));
    await user.click(screen.getByRole('combobox', { name: 'Categories' }));
    await user.click(screen.getByRole('option', { name: `Custom fields (4)` }));
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');

    await waitForReload();

    await user.click(screen.getByTestId('filters-button'));
    await user.click(screen.getByRole('combobox', { name: `Categories` }));
    await user.click(screen.getByRole('option', { name: `Monitoring (1)` }));
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');

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
    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    const collectionsButton = screen.getByRole('combobox', { name: 'Collections' });
    await user.click(collectionsButton);

    const option = screen.getByTestId('Made by Strapi-13');
    await user.click(option);
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');

    await waitForReload();

    const optionTag = screen.getByRole('button', { name: 'Made by Strapi' });
    expect(optionTag).toBeVisible();

    await user.click(optionTag);

    expect(optionTag).not.toBeVisible();
    expect(history.location.search).toBe('?page=1');
  });

  it('only filters in the plugins tab', async () => {
    const filtersButton = screen.getByTestId('filters-button');
    await user.click(filtersButton);

    const collectionsButton = screen.getByRole('combobox', { name: 'Collections' });
    await user.click(collectionsButton);

    const option = screen.getByTestId('Made by Strapi-13');
    await user.click(option);
    // Close the combobox
    await user.keyboard('[Escape]');
    // Close the popover
    await user.keyboard('[Escape]');

    const collectionCards = await screen.findAllByTestId('npm-package-card');
    expect(collectionCards.length).toBe(2);

    await user.click(screen.getByRole('tab', { name: /providers/i }));

    const providerCards = screen.getAllByTestId('npm-package-card');
    expect(providerCards.length).toBe(9);

    await user.click(screen.getByRole('tab', { name: /plugins/i }));
    expect(collectionCards.length).toBe(2);
  });

  it('shows the correct options on sort select', async () => {
    const sortButton = screen.getByRole('combobox', { name: /Sort by/i });

    await user.click(sortButton);

    expect(screen.getByRole('option', { name: 'Alphabetical order' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Newest' })).toBeVisible();
  });

  it('changes the url on sort option select', async () => {
    const sortButton = screen.getByRole('combobox', { name: /Sort by/i });
    await user.click(sortButton);

    await user.click(screen.getByRole('option', { name: 'Newest' }));
    expect(history.location.search).toEqual('?sort=submissionDate:desc&page=1');
  });

  it('shows github stars and weekly downloads count for each plugin', () => {
    const documentationCard = screen
      .getAllByTestId('npm-package-card')
      .find((div) => div.innerHTML.includes('Documentation'));

    const githubStarsLabel = within(documentationCard).getByLabelText(
      /this plugin was starred \d+ on GitHub/i
    );

    expect(githubStarsLabel).toBeVisible();

    const downloadsLabel = within(documentationCard).getByLabelText(
      /this plugin has \d+ weekly downloads/i
    );
    expect(downloadsLabel).toBeVisible();
  });

  it('paginates the results', async () => {
    // Should have pagination section with 4 pages
    const pagination = screen.getByLabelText(/pagination/i);
    expect(pagination).toBeVisible();
    const pageButtons = screen.getAllByText(/go to page \d+/i).map((el) => el.closest('a'));
    expect(pageButtons.length).toBe(4);

    // Can't go to previous page since there isn't one
    expect(screen.getByText(/go to previous page/i).closest('a')).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    // Can go to next page
    await user.click(screen.getByText(/go to next page/i).closest('a'));
    await waitForReload();
    expect(history.location.search).toBe('?page=2');

    // Can go to previous page
    await user.click(screen.getByText(/go to previous page/i).closest('a'));
    await waitForReload();
    expect(history.location.search).toBe('?page=1');

    // Can go to specific page
    await user.click(screen.getByText(/go to page 3/i).closest('a'));
    await waitForReload();
    expect(history.location.search).toBe('?page=3');
  });
});
