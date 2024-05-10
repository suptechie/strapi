import { test, expect } from '@playwright/test';
import { login } from '../../utils/login';
import { resetDatabaseAndImportDataFromPath } from '../../utils/dts-import';
import { findAndClose } from '../../utils/shared';

test.describe('Edit View', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabaseAndImportDataFromPath('with-admin.tar');
    await page.goto('/admin');
    await login({ page });
  });

  test.describe('Collection Type', () => {
    const CREATE_URL =
      /\/admin\/content-manager\/collection-types\/api::article.article\/create(\?.*)?/;
    const LIST_URL = /\/admin\/content-manager\/collection-types\/api::article.article(\?.*)?/;

    test('as a user I want to create and publish a document at the same time, then modify and save that document.', async ({
      page,
    }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('link', { name: /Create new entry/ }).click();

      /**
       * Now we're in the edit view.
       */
      await page.waitForURL(CREATE_URL);

      await expect(page.getByRole('heading', { name: 'Create an entry' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'More actions' })).not.toBeDisabled();

      /**
       * There should be two tabs, draft and published.
       * The draft tab should be active by default.
       * The published tab should be disabled.
       */
      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();

      /**
       * Both the publish & save button should be enabled only after we start filling in the form
       * and it should disable itself after we save the entry. The publish button should still be enabled.
       */
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).toBeDisabled();
      await page.getByRole('textbox', { name: 'title' }).fill('Being from Kansas City');

      await page.getByRole('button', { name: 'Publish' }).click();
      await findAndClose(page, 'Published Document');

      /**
       * When we click publish, we should stay on the draft tab but check the published tab to ensure
       * all the actions are disabled, going back to the draft tab will tell us what actions are then
       * available.
       */
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toBeEnabled();
      await page.getByRole('tab', { name: 'Published' }).click();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).toBeDisabled();

      await page.getByRole('tab', { name: 'Draft' }).click();
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).not.toBeDisabled();

      await page.getByRole('button', { name: 'More document actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Unpublish' })).not.toBeDisabled();
      await expect(page.getByRole('menuitem', { name: 'Discard changes' })).toBeDisabled();
      await page.keyboard.press('Escape'); // close the menu since we're not actioning on it atm.

      /**
       * Now we go back to the list view to confirm our new entry has been correctly added to the database.
       */
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.waitForURL(LIST_URL);
      await expect(page.getByRole('gridcell', { name: 'Being from Kansas City' })).toBeVisible();
      await page.getByRole('gridcell', { name: 'Being from Kansas City' }).click();

      await page.getByRole('combobox', { name: 'authors' }).click();
      expect(page.getByRole('option', { name: 'Ted Lasso Draft' })).toBeEnabled();
      await page.getByRole('option', { name: 'Ted Lasso Draft' }).click();

      await expect(page.getByRole('link', { name: 'Ted Lasso' })).toBeVisible();

      await page.getByRole('button', { name: 'Save' }).click();
      await findAndClose(page, 'Saved Document');

      await expect(page.getByText('Modified')).toBeVisible();
    });

    test('as a user I want to create a document, then modify that document', async ({ page }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('link', { name: /Create new entry/ }).click();

      /**
       * Now we're in the edit view.
       */
      await page.waitForURL(CREATE_URL);

      await expect(page.getByRole('heading', { name: 'Create an entry' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'More actions' })).not.toBeDisabled();

      /**
       * There should be two tabs, draft and published.
       * The draft tab should be active by default.
       * The published tab should be disabled.
       */
      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();

      /**
       * Both the publish & save button should be enabled only after we start filling in the form
       * and it should disable itself after we save the entry. The publish button should still be enabled.
       */
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).toBeDisabled();
      await page.getByRole('textbox', { name: 'title' }).fill('Being from Kansas City');

      await page.getByRole('button', { name: 'Save' }).click();
      await findAndClose(page, 'Saved Document');

      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).toBeEnabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();

      // the title should update post save because it's the `mainField` of the content-type
      await expect(page.getByRole('heading', { name: 'Being from Kansas City' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Create an entry' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).not.toBeDisabled();

      await page.getByRole('textbox', { name: 'title' }).fill('Being an American');
      await page
        .getByRole('textbox')
        .nth(1)
        .fill('I miss the denver broncos, now I can only watch it on the evening.');

      await page.getByRole('combobox', { name: 'authors' }).click();
      expect(page.getByRole('option', { name: 'Ted Lasso Draft' })).toBeEnabled();
      await page.getByRole('option', { name: 'Ted Lasso Draft' }).click();

      await expect(page.getByRole('link', { name: 'Ted Lasso' })).toBeVisible();

      await expect(page.getByRole('button', { name: 'Save' })).not.toBeDisabled();

      await page.getByRole('button', { name: 'Save' }).click();
      await findAndClose(page, 'Saved Document');

      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).toBeEnabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();
      await expect(page.getByText('Modified')).not.toBeVisible();

      /**
       * Now we go back to the list view to confirm our new entry has been correctly added to the database.
       */
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.waitForURL(LIST_URL);
      await expect(page.getByRole('gridcell', { name: 'Being an American' })).toBeVisible();
      await page.getByRole('gridcell', { name: 'Being an American' }).click();

      await expect(page.getByRole('heading', { name: 'Being an American' })).toBeVisible();
    });

    test('as a user I want to be able to discard my changes', async ({ page }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('gridcell', { name: 'West Ham post match analysis' }).click();

      await page.getByRole('button', { name: 'Publish' }).click();

      await findAndClose(page, 'Published Document');

      await page.getByRole('button', { name: 'More document actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Discard changes' })).toBeDisabled();
      await page.keyboard.press('Escape'); // close the menu since we're not actioning on it atm.

      await page.getByRole('textbox', { name: 'title' }).fill('West Ham vs Richmond AFC');
      await page.getByRole('button', { name: 'Save' }).click();

      await findAndClose(page, 'Saved Document');

      await page.getByRole('button', { name: 'More document actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Discard changes' })).not.toBeDisabled();

      await page.getByRole('menuitem', { name: 'Discard changes' }).click();
      await expect(page.getByRole('dialog', { name: 'Confirmation' })).toBeVisible();
      await page.getByRole('button', { name: 'Confirm' }).click();

      await findAndClose(page, 'Changes discarded');
    });

    test('as a user I want to unpublish a document', async ({ page }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('gridcell', { name: 'West Ham post match analysis' }).click();

      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();

      await page.getByRole('button', { name: 'Publish' }).click();
      await findAndClose(page, 'Published Document');

      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).not.toBeDisabled();

      await page.getByRole('button', { name: 'More document actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Unpublish' })).not.toBeDisabled();
      await page.getByRole('menuitem', { name: 'Unpublish' }).click();

      await findAndClose(page, 'Unpublished Document');

      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();
    });

    test('as a user I want to delete a document', async ({ page }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('gridcell', { name: 'West Ham post match analysis' }).click();

      await page.getByRole('button', { name: 'More actions' }).click();
      await page.getByRole('menuitem', { name: 'Delete document' }).click();
      await expect(page.getByRole('dialog', { name: 'Confirmation' })).toBeVisible();
      await page.getByRole('button', { name: 'Confirm' }).click();

      await findAndClose(page, 'Deleted Document');

      /**
       * We're back on the list view and we can asser the document was correctly deleted.
       */
      await page.waitForURL(LIST_URL);
      await expect(
        page.getByRole('gridcell', { name: 'West Ham post match analysis' })
      ).not.toBeVisible();
    });
  });

  test.describe('Single Type', () => {
    const EDIT_URL = /\/admin\/content-manager\/single-types\/api::homepage.homepage(\?.*)?/;

    test('as a user I want to create and publish a document at the same time, then modify and save that document.', async ({
      page,
    }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('link', { name: 'Homepage' }).click();

      /**
       * Now we're in the edit view.
       */
      await page.waitForURL(EDIT_URL);

      await expect(page.getByRole('heading', { name: 'Untitled' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'More actions' })).not.toBeDisabled();

      /**
       * There should be two tabs, draft and published.
       * The draft tab should be active by default.
       * The published tab should be disabled.
       */
      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();

      /**
       * Both the publish & save button should be enabled only after we start filling in the form
       * and it should disable itself after we save the entry. The publish button should still be enabled.
       */
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).toBeDisabled();
      await page.getByRole('textbox', { name: 'title' }).fill('Welcome to AFC Richmond');

      await page.getByRole('button', { name: 'Publish' }).click();
      await findAndClose(page, 'Published Document');

      /**
       * When we click publish, we should stay on the draft tab but check the published tab to ensure
       * all the actions are disabled, going back to the draft tab will tell us what actions are then
       * available.
       */
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toBeEnabled();
      await page.getByRole('tab', { name: 'Published' }).click();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).toBeDisabled();

      await page.getByRole('tab', { name: 'Draft' }).click();
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).not.toBeDisabled();

      await page.getByRole('button', { name: 'More document actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Unpublish' })).not.toBeDisabled();
      await expect(page.getByRole('menuitem', { name: 'Discard changes' })).toBeDisabled();
      await page.keyboard.press('Escape'); // close the menu since we're not actioning on it atm.

      await page.getByRole('textbox').nth(1).click();
      await page
        .getByRole('textbox')
        .nth(1)
        .fill(
          "We're a premier league football club based in South West London with a vicious rivalry with Fulham. Because who doens't hate them?"
        );

      await page.getByRole('button', { name: 'Save' }).click();
      await findAndClose(page, 'Saved Document');

      await expect(page.getByText('Modified')).toBeVisible();
    });

    test('as a user I want to create a document, then modify that document', async ({ page }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('link', { name: 'Homepage' }).click();

      /**
       * Now we're in the edit view.
       */
      await page.waitForURL(EDIT_URL);

      await expect(page.getByRole('heading', { name: 'Untitled' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'More actions' })).not.toBeDisabled();

      /**
       * There should be two tabs, draft and published.
       * The draft tab should be active by default.
       * The published tab should be disabled.
       */
      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();

      /**
       * Both the publish & save button should be enabled only after we start filling in the form
       * and it should disable itself after we save the entry. The publish button should still be enabled.
       */
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).toBeDisabled();
      await page.getByRole('textbox', { name: 'title' }).fill('Welcome to AFC Richmond');

      await page.getByRole('button', { name: 'Save' }).click();
      await findAndClose(page, 'Saved Document');

      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).toBeEnabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();

      // the title should update post save because it's the `mainField` of the content-type
      await expect(page.getByRole('heading', { name: 'Welcome to AFC Richmond' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Untitled' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'More document actions' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Publish' })).not.toBeDisabled();

      await page.getByRole('textbox').nth(1).click();
      await page
        .getByRole('textbox')
        .nth(1)
        .fill(
          "We're a premier league football club based in South West London with a vicious rivalry with Fulham. Because who doens't hate them?"
        );

      await expect(page.getByRole('button', { name: 'Save' })).not.toBeDisabled();

      await page.getByRole('button', { name: 'Save' }).click();
      await findAndClose(page, 'Saved Document');

      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).toBeEnabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();
      await expect(page.getByText('Modified')).not.toBeVisible();
    });

    /**
     * You can't discard changes on single-types due to a bug.
     * @see https://github.com/strapi/strapi/issues/20085
     */
    test.fixme('as a user I want to be able to discard my changes', async ({ page }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('link', { name: 'Shop' }).click();

      await page.getByRole('button', { name: 'Publish' }).click();

      await findAndClose(page, 'Published Document');

      await page.getByRole('button', { name: 'More document actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Discard changes' })).toBeDisabled();
      await page.keyboard.press('Escape'); // close the menu since we're not actioning on it atm.

      await page
        .getByRole('textbox', { name: 'title * (This value is unique for the selected locale)' })
        .fill('International Shop');
      await page.getByRole('button', { name: 'Save' }).click();

      await findAndClose(page, 'Saved Document');

      await page.getByRole('button', { name: 'More document actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Discard changes' })).not.toBeDisabled();

      await page.getByRole('menuitem', { name: 'Discard changes' }).click();
      await expect(page.getByRole('dialog', { name: 'Confirmation' })).toBeVisible();
      await page.getByRole('button', { name: 'Confirm' }).click();

      await findAndClose(page, 'Changes discarded');

      await expect(page.getByRole('heading', { name: 'UK Shop' })).toBeVisible();
    });

    test('as a user I want to unpublish a document', async ({ page }) => {
      await page.getByRole('link', { name: 'Content Manager' }).click();
      await page.getByRole('link', { name: 'Shop' }).click();

      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();

      await page.getByRole('button', { name: 'Publish' }).click();
      await findAndClose(page, 'Published Document');

      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).not.toBeDisabled();

      await page.getByRole('button', { name: 'More document actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Unpublish' })).not.toBeDisabled();
      await page.getByRole('menuitem', { name: 'Unpublish' }).click();

      await findAndClose(page, 'Unpublished Document');

      await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Draft' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute(
        'aria-selected',
        'false'
      );
      await expect(page.getByRole('tab', { name: 'Draft' })).not.toBeDisabled();
      await expect(page.getByRole('tab', { name: 'Published' })).toBeDisabled();
    });
  });
});
