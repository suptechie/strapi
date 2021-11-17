import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { NotificationsProvider } from '@strapi/helper-plugin';
import { RemoveAssetDialog } from '../RemoveAssetDialog';
import en from '../../../translations/en.json';
import server from './server';

const messageForPlugin = Object.keys(en).reduce((acc, curr) => {
  acc[curr] = `upload.${en[curr]}`;

  return acc;
}, {});

const asset = {
  id: 8,
  name: 'Screenshot 2.png',
  alternativeText: null,
  caption: null,
  width: 1476,
  height: 780,
  formats: {
    thumbnail: {
      name: 'thumbnail_Screenshot 2.png',
      hash: 'thumbnail_Screenshot_2_5d4a574d61',
      ext: '.png',
      mime: 'image/png',
      width: 245,
      height: 129,
      size: 10.7,
      path: null,
      url: '/uploads/thumbnail_Screenshot_2_5d4a574d61.png',
    },
    large: {
      name: 'large_Screenshot 2.png',
      hash: 'large_Screenshot_2_5d4a574d61',
      ext: '.png',
      mime: 'image/png',
      width: 1000,
      height: 528,
      size: 97.1,
      path: null,
      url: '/uploads/large_Screenshot_2_5d4a574d61.png',
    },
    medium: {
      name: 'medium_Screenshot 2.png',
      hash: 'medium_Screenshot_2_5d4a574d61',
      ext: '.png',
      mime: 'image/png',
      width: 750,
      height: 396,
      size: 58.7,
      path: null,
      url: '/uploads/medium_Screenshot_2_5d4a574d61.png',
    },
    small: {
      name: 'small_Screenshot 2.png',
      hash: 'small_Screenshot_2_5d4a574d61',
      ext: '.png',
      mime: 'image/png',
      width: 500,
      height: 264,
      size: 31.06,
      path: null,
      url: '/uploads/small_Screenshot_2_5d4a574d61.png',
    },
  },
  hash: 'Screenshot_2_5d4a574d61',
  ext: '.png',
  mime: 'image/png',
  size: 102.01,
  url: '/uploads/Screenshot_2_5d4a574d61.png',
  previewUrl: null,
  provider: 'local',
  provider_metadata: null,
  createdAt: '2021-10-04T09:42:31.670Z',
  updatedAt: '2021-10-04T09:42:31.670Z',
};

const renderCompo = (handleCloseSpy = jest.fn(), toggleNotificationSpy = jest.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={lightTheme}>
        <NotificationsProvider toggleNotification={toggleNotificationSpy}>
          <IntlProvider locale="en" messages={messageForPlugin} defaultLocale="en">
            <RemoveAssetDialog onClose={handleCloseSpy} asset={asset} />
          </IntlProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </QueryClientProvider>,
    { container: document.body }
  );
};

describe('RemoveAssetDialog', () => {
  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('snapshots the component', () => {
    const { container } = renderCompo();

    expect(container).toMatchInlineSnapshot(`
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

      .c21 {
        font-weight: 600;
        color: #32324d;
        font-size: 0.75rem;
        line-height: 1.33;
      }

      .c24 {
        padding-right: 8px;
      }

      .c18 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        background: #ffffff;
        border: 1px solid #dcdce4;
        position: relative;
        outline: none;
      }

      .c18 svg {
        height: 12px;
        width: 12px;
      }

      .c18 svg > g,
      .c18 svg path {
        fill: #ffffff;
      }

      .c18[aria-disabled='true'] {
        pointer-events: none;
      }

      .c18:after {
        -webkit-transition-property: all;
        transition-property: all;
        -webkit-transition-duration: 0.2s;
        transition-duration: 0.2s;
        border-radius: 8px;
        content: '';
        position: absolute;
        top: -4px;
        bottom: -4px;
        left: -4px;
        right: -4px;
        border: 2px solid transparent;
      }

      .c18:focus-visible {
        outline: none;
      }

      .c18:focus-visible:after {
        border-radius: 8px;
        content: '';
        position: absolute;
        top: -5px;
        bottom: -5px;
        left: -5px;
        right: -5px;
        border: 2px solid #4945ff;
      }

      .c25 {
        height: 100%;
      }

      .c19 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        padding: 8px 16px;
        background: #4945ff;
        border: none;
        border: 1px solid #dcdce4;
        background: #ffffff;
      }

      .c19 .c23 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c19 .c20 {
        color: #ffffff;
      }

      .c19[aria-disabled='true'] {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c19[aria-disabled='true'] .c20 {
        color: #666687;
      }

      .c19[aria-disabled='true'] svg > g,
      .c19[aria-disabled='true'] svg path {
        fill: #666687;
      }

      .c19[aria-disabled='true']:active {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c19[aria-disabled='true']:active .c20 {
        color: #666687;
      }

      .c19[aria-disabled='true']:active svg > g,
      .c19[aria-disabled='true']:active svg path {
        fill: #666687;
      }

      .c19:hover {
        background-color: #f6f6f9;
      }

      .c19:active {
        background-color: #eaeaef;
      }

      .c19 .c20 {
        color: #32324d;
      }

      .c19 svg > g,
      .c19 svg path {
        fill: #32324d;
      }

      .c22 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        padding: 8px 16px;
        background: #4945ff;
        border: none;
        border: 1px solid #f5c0b8;
        background: #fcecea;
      }

      .c22 .c23 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c22 .c20 {
        color: #ffffff;
      }

      .c22[aria-disabled='true'] {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c22[aria-disabled='true'] .c20 {
        color: #666687;
      }

      .c22[aria-disabled='true'] svg > g,
      .c22[aria-disabled='true'] svg path {
        fill: #666687;
      }

      .c22[aria-disabled='true']:active {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c22[aria-disabled='true']:active .c20 {
        color: #666687;
      }

      .c22[aria-disabled='true']:active svg > g,
      .c22[aria-disabled='true']:active svg path {
        fill: #666687;
      }

      .c22:hover {
        background-color: #ffffff;
      }

      .c22:active {
        background-color: #ffffff;
        border: 1px solid #d02b20;
      }

      .c22:active .c20 {
        color: #d02b20;
      }

      .c22:active svg > g,
      .c22:active svg path {
        fill: #d02b20;
      }

      .c22 .c20 {
        color: #b72b1a;
      }

      .c22 svg > g,
      .c22 svg path {
        fill: #b72b1a;
      }

      .c2 {
        background: #ffffff;
        border-radius: 4px;
        box-shadow: 0px 2px 15px rgba(33,33,52,0.1);
      }

      .c4 {
        padding: 24px;
      }

      .c8 {
        padding-top: 40px;
        padding-right: 24px;
        padding-bottom: 40px;
        padding-left: 24px;
      }

      .c9 {
        padding-bottom: 8px;
      }

      .c14 {
        padding: 16px;
      }

      .c5 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: row;
        -ms-flex-direction: row;
        flex-direction: row;
        -webkit-box-pack: center;
        -webkit-justify-content: center;
        -ms-flex-pack: center;
        justify-content: center;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c16 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: row;
        -ms-flex-direction: row;
        flex-direction: row;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c7 {
        color: #32324d;
        font-weight: 600;
        font-size: 1.125rem;
        line-height: 1.22;
      }

      .c1 {
        position: fixed;
        z-index: 4;
        inset: 0;
        background: #32324d33;
        padding: 0 40px;
      }

      .c3 {
        max-width: 25.75rem;
        margin: 0 auto;
        overflow: hidden;
        margin-top: 10%;
      }

      .c6 {
        border-bottom: 1px solid #eaeaef;
      }

      .c10 svg {
        width: 24px;
        height: 24px;
      }

      .c10 svg path {
        fill: #d02b20;
      }

      .c17 > * {
        margin-left: 0;
        margin-right: 0;
      }

      .c17 > * + * {
        margin-left: 8px;
      }

      .c15 {
        border-top: 1px solid #eaeaef;
      }

      .c15 button {
        width: 100%;
        display: -webkit-inline-box;
        display: -webkit-inline-flex;
        display: -ms-inline-flexbox;
        display: inline-flex;
        -webkit-box-pack: center;
        -webkit-justify-content: center;
        -ms-flex-pack: center;
        justify-content: center;
      }

      .c12 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: row;
        -ms-flex-direction: row;
        flex-direction: row;
        -webkit-box-pack: center;
        -webkit-justify-content: center;
        -ms-flex-pack: center;
        justify-content: center;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c11 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c11 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c11 > * + * {
        margin-top: 8px;
      }

      .c13 {
        color: #32324d;
        font-size: 0.875rem;
        line-height: 1.43;
      }

      <body
        class="lock-body-scroll"
      >
        <div
          class="c0"
        >
          <p
            aria-live="polite"
            aria-relevant="all"
            id="live-region-log"
            role="log"
          />
          <p
            aria-live="polite"
            aria-relevant="all"
            id="live-region-status"
            role="status"
          />
          <p
            aria-live="assertive"
            aria-relevant="all"
            id="live-region-alert"
            role="alert"
          />
        </div>
        <div
          data-react-portal="true"
        >
          <div
            class="c1"
          >
            <div>
              <div
                aria-labelledby="dialog-1-label"
                aria-modal="true"
                class="c2 c3"
                role="dialog"
              >
                <div
                  class="c4 c5 c6"
                >
                  <h2
                    class="c7"
                    id="dialog-1-label"
                  >
                    Confirmation
                  </h2>
                </div>
                <div
                  class=""
                >
                  <div
                    class="c8"
                  >
                    <div
                      class="c9 c10"
                    >
                      <div
                        class="c5"
                      >
                        <svg
                          fill="none"
                          height="1em"
                          viewBox="0 0 24 24"
                          width="1em"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm1.154 18.456h-2.308V16.15h2.308v2.307zm-.23-3.687h-1.847l-.346-9.23h2.538l-.346 9.23z"
                            fill="#212134"
                          />
                        </svg>
                      </div>
                    </div>
                    <div
                      class="c11"
                    >
                      <div
                        class="c12"
                      >
                        <span
                          class="c13"
                          id="confirm-description"
                        >
                          Are you sure you want to delete this?
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c14 c15"
                  >
                    <div
                      class="c16 c17"
                    >
                      <button
                        aria-disabled="false"
                        class="c18 c19"
                        type="button"
                      >
                        <span
                          class="c20 c21"
                        >
                          Cancel
                        </span>
                      </button>
                      <button
                        aria-disabled="false"
                        class="c18 c22"
                        id="confirm-delete"
                        type="button"
                      >
                        <div
                          aria-hidden="true"
                          class="c23 c24 c25"
                        >
                          <svg
                            fill="none"
                            height="1em"
                            viewBox="0 0 24 24"
                            width="1em"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3.236 6.149a.2.2 0 00-.197.233L6 24h12l2.96-17.618a.2.2 0 00-.196-.233H3.236zM21.8 1.983c.11 0 .2.09.2.2v1.584a.2.2 0 01-.2.2H2.2a.2.2 0 01-.2-.2V2.183c0-.11.09-.2.2-.2h5.511c.9 0 1.631-1.09 1.631-1.983h5.316c0 .894.73 1.983 1.631 1.983H21.8z"
                              fill="#32324D"
                            />
                          </svg>
                        </div>
                        <span
                          class="c20 c21"
                        >
                          Confirm
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    `);
  });

  it('closes the dialog when pressing cancel', () => {
    const handleCloseSpy = jest.fn();
    renderCompo(handleCloseSpy);

    fireEvent.click(screen.getByText('Cancel'));
    expect(handleCloseSpy).toHaveBeenCalled();
  });

  describe('remove asset', () => {
    it('closes the dialog when everything is going okay when removing', async () => {
      const handleCloseSpy = jest.fn();
      const toggleNotificationSpy = jest.fn();
      renderCompo(handleCloseSpy, toggleNotificationSpy);

      fireEvent.click(screen.getByText('Confirm'));

      await waitFor(() => expect(handleCloseSpy).toHaveBeenCalled());
      await waitFor(() =>
        expect(toggleNotificationSpy).toHaveBeenCalledWith({
          message: {
            defaultMessage: 'The asset has been successfully removed.',
            id: 'modal.remove.success-label',
          },
          type: 'success',
        })
      );
    });
  });
});
