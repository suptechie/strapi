import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import { useRBAC } from '@strapi/helper-plugin';
import ProtectedAdvancedSettingsPage from '../index';
import server from './utils/server';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useNotification: jest.fn(),
  useFocusWhenNavigate: jest.fn(),
  useOverlayBlocker: jest.fn(() => ({ lockApp: jest.fn, unlockApp: jest.fn() })),
  useRBAC: jest.fn(),
  CheckPagePermissions: ({ children }) => children,
}));

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const App = (
  <QueryClientProvider client={client}>
    <IntlProvider messages={{ en: {} }} textComponent="span" locale="en">
      <ThemeProvider theme={lightTheme}>
        <ProtectedAdvancedSettingsPage />
      </ThemeProvider>
    </IntlProvider>
  </QueryClientProvider>
);

describe('ADMIN | Pages | Settings | Advanced Settings', () => {
  beforeAll(() => server.listen());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    jest.resetAllMocks();
    server.close();
  });

  it('renders and matches the snapshot', async () => {
    useRBAC.mockImplementation(() => ({
      isLoading: false,
      allowedActions: { canUpdate: true },
    }));

    const { container } = render(App);
    await waitFor(() => {
      expect(screen.getByText('Default role for authenticated users')).toBeInTheDocument();
    });

    expect(container.firstChild).toMatchInlineSnapshot(`
      .c34 {
        font-size: 0.75rem;
        line-height: 1.33;
        font-weight: 600;
        color: #32324d;
      }

      .c42 {
        font-size: 0.75rem;
        line-height: 1.33;
        font-weight: 600;
        color: #b72b1a;
        text-transform: uppercase;
      }

      .c44 {
        font-size: 0.75rem;
        line-height: 1.33;
        font-weight: 600;
        color: #666687;
        text-transform: uppercase;
      }

      .c46 {
        font-size: 0.75rem;
        line-height: 1.33;
        color: #666687;
      }

      .c37 {
        background: #f6f6f9;
        padding: 4px;
        border-radius: 4px;
        border-style: solid;
        border-width: 1px;
        border-color: #dcdce4;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
      }

      .c39 {
        padding-right: 12px;
        padding-left: 12px;
        border-radius: 4px;
      }

      .c31 {
        -webkit-align-items: stretch;
        -webkit-box-align: stretch;
        -ms-flex-align: stretch;
        align-items: stretch;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c33 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: row;
        -ms-flex-direction: row;
        flex-direction: row;
      }

      .c40 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
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
      }

      .c48 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: row;
        -ms-flex-direction: row;
        flex-direction: row;
        -webkit-box-pack: justify;
        -webkit-justify-content: space-between;
        -ms-flex-pack: justify;
        justify-content: space-between;
      }

      .c32 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c32 > * + * {
        margin-top: 4px;
      }

      .c36 {
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

      .c50 {
        border: none;
        border-radius: 4px;
        padding-bottom: 0.65625rem;
        padding-left: 16px;
        padding-right: 16px;
        padding-top: 0.65625rem;
        color: #32324d;
        font-weight: 400;
        font-size: 0.875rem;
        display: block;
        width: 100%;
        background: inherit;
      }

      .c50::-webkit-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c50::-moz-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c50:-ms-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c50::placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c50[aria-disabled='true'] {
        color: inherit;
      }

      .c50:focus {
        outline: none;
        box-shadow: none;
      }

      .c52 {
        border: none;
        border-radius: 4px;
        padding-bottom: 0.65625rem;
        padding-left: 16px;
        padding-right: 16px;
        padding-top: 0.65625rem;
        cursor: not-allowed;
        color: #32324d;
        font-weight: 400;
        font-size: 0.875rem;
        display: block;
        width: 100%;
        background: inherit;
      }

      .c52::-webkit-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c52::-moz-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c52:-ms-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c52::placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c52[aria-disabled='true'] {
        color: inherit;
      }

      .c52:focus {
        outline: none;
        box-shadow: none;
      }

      .c49 {
        border: 1px solid #dcdce4;
        border-radius: 4px;
        background: #ffffff;
        outline: none;
        box-shadow: 0;
        -webkit-transition-property: border-color,box-shadow,fill;
        transition-property: border-color,box-shadow,fill;
        -webkit-transition-duration: 0.2s;
        transition-duration: 0.2s;
      }

      .c49:focus-within {
        border: 1px solid #4945ff;
        box-shadow: #4945ff 0px 0px 0px 2px;
      }

      .c51 {
        border: 1px solid #dcdce4;
        border-radius: 4px;
        background: #ffffff;
        outline: none;
        box-shadow: 0;
        -webkit-transition-property: border-color,box-shadow,fill;
        transition-property: border-color,box-shadow,fill;
        -webkit-transition-duration: 0.2s;
        transition-duration: 0.2s;
        color: #666687;
        background: #eaeaef;
      }

      .c51:focus-within {
        border: 1px solid #4945ff;
        box-shadow: #4945ff 0px 0px 0px 2px;
      }

      .c35 {
        position: relative;
        display: inline-block;
        z-index: 0;
        width: 100%;
      }

      .c38 {
        overflow: hidden;
        -webkit-flex-wrap: wrap;
        -ms-flex-wrap: wrap;
        flex-wrap: wrap;
        outline: none;
        box-shadow: 0;
        -webkit-transition-property: border-color,box-shadow,fill;
        transition-property: border-color,box-shadow,fill;
        -webkit-transition-duration: 0.2s;
        transition-duration: 0.2s;
      }

      .c38:focus-within {
        border: 1px solid #4945ff;
        box-shadow: #4945ff 0px 0px 0px 2px;
      }

      .c41 {
        background-color: #ffffff;
        border: 1px solid #dcdce4;
        position: relative;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        z-index: 2;
        -webkit-flex: 1 1 50%;
        -ms-flex: 1 1 50%;
        flex: 1 1 50%;
        padding-top: 6px;
        padding-bottom: 6px;
      }

      .c43 {
        background-color: transparent;
        border: 1px solid #f6f6f9;
        position: relative;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        z-index: 2;
        -webkit-flex: 1 1 50%;
        -ms-flex: 1 1 50%;
        flex: 1 1 50%;
        padding-top: 6px;
        padding-bottom: 6px;
      }

      .c45 {
        height: 100%;
        left: 0;
        opacity: 0;
        position: absolute;
        top: 0;
        z-index: 1;
        width: 100%;
      }

      .c30 {
        max-width: 320px;
      }

      .c2 {
        background: #f6f6f9;
        padding-top: 40px;
        padding-right: 56px;
        padding-bottom: 40px;
        padding-left: 56px;
      }

      .c12 {
        padding-right: 56px;
        padding-left: 56px;
      }

      .c9 {
        padding-right: 8px;
      }

      .c13 {
        background: #ffffff;
        padding-top: 24px;
        padding-right: 32px;
        padding-bottom: 24px;
        padding-left: 32px;
        border-radius: 4px;
        box-shadow: 0px 1px 4px rgba(33,33,52,0.1);
      }

      .c23 {
        padding-right: 16px;
        padding-left: 16px;
      }

      .c25 {
        padding-left: 12px;
      }

      .c3 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: row;
        -ms-flex-direction: row;
        flex-direction: row;
        -webkit-box-pack: justify;
        -webkit-justify-content: space-between;
        -ms-flex-pack: justify;
        justify-content: space-between;
      }

      .c4 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: row;
        -ms-flex-direction: row;
        flex-direction: row;
      }

      .c14 {
        -webkit-align-items: stretch;
        -webkit-box-align: stretch;
        -ms-flex-align: stretch;
        align-items: stretch;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c6 {
        font-weight: 600;
        font-size: 2rem;
        line-height: 1.25;
        color: #32324d;
      }

      .c11 {
        font-size: 0.75rem;
        line-height: 1.33;
        font-weight: 600;
        color: #32324d;
      }

      .c16 {
        font-weight: 500;
        font-size: 1rem;
        line-height: 1.25;
        color: #32324d;
      }

      .c24 {
        font-size: 0.875rem;
        line-height: 1.43;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #32324d;
      }

      .c28 {
        font-size: 0.75rem;
        line-height: 1.33;
        color: #666687;
      }

      .c15 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c15 > * + * {
        margin-top: 16px;
      }

      .c19 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c19 > * + * {
        margin-top: 4px;
      }

      .c7 {
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

      .c7 svg {
        height: 12px;
        width: 12px;
      }

      .c7 svg > g,
      .c7 svg path {
        fill: #ffffff;
      }

      .c7[aria-disabled='true'] {
        pointer-events: none;
      }

      .c7:after {
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

      .c7:focus-visible {
        outline: none;
      }

      .c7:focus-visible:after {
        border-radius: 8px;
        content: '';
        position: absolute;
        top: -5px;
        bottom: -5px;
        left: -5px;
        right: -5px;
        border: 2px solid #4945ff;
      }

      .c10 {
        height: 100%;
      }

      .c8 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        background-color: #4945ff;
        border: 1px solid #4945ff;
        height: 2rem;
        padding-left: 16px;
        padding-right: 16px;
      }

      .c8 .c1 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c8 .c5 {
        color: #ffffff;
      }

      .c8[aria-disabled='true'] {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c8[aria-disabled='true'] .c5 {
        color: #666687;
      }

      .c8[aria-disabled='true'] svg > g,.c8[aria-disabled='true'] svg path {
        fill: #666687;
      }

      .c8[aria-disabled='true']:active {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c8[aria-disabled='true']:active .c5 {
        color: #666687;
      }

      .c8[aria-disabled='true']:active svg > g,.c8[aria-disabled='true']:active svg path {
        fill: #666687;
      }

      .c8:hover {
        border: 1px solid #7b79ff;
        background: #7b79ff;
      }

      .c8:active {
        border: 1px solid #4945ff;
        background: #4945ff;
      }

      .c8 svg > g,
      .c8 svg path {
        fill: #ffffff;
      }

      .c21 {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        top: 0;
        width: 100%;
        background: transparent;
        border: none;
      }

      .c21:focus {
        outline: none;
      }

      .c21[aria-disabled='true'] {
        cursor: not-allowed;
      }

      .c20 {
        position: relative;
        border: 1px solid #dcdce4;
        padding-right: 12px;
        border-radius: 4px;
        background: #ffffff;
        overflow: hidden;
        min-height: 2.5rem;
        outline: none;
        box-shadow: 0;
        -webkit-transition-property: border-color,box-shadow,fill;
        transition-property: border-color,box-shadow,fill;
        -webkit-transition-duration: 0.2s;
        transition-duration: 0.2s;
      }

      .c20:focus-within {
        border: 1px solid #4945ff;
        box-shadow: #4945ff 0px 0px 0px 2px;
      }

      .c26 {
        background: transparent;
        border: none;
        position: relative;
        z-index: 1;
      }

      .c26 svg {
        height: 0.6875rem;
        width: 0.6875rem;
      }

      .c26 svg path {
        fill: #666687;
      }

      .c27 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        background: none;
        border: none;
      }

      .c27 svg {
        width: 0.375rem;
      }

      .c22 {
        width: 100%;
      }

      .c0:focus-visible {
        outline: none;
      }

      .c17 {
        display: grid;
        grid-template-columns: repeat(12,1fr);
        gap: 24px;
      }

      .c18 {
        grid-column: span 6;
        max-width: 100%;
      }

      .c29 {
        grid-column: span 12;
        max-width: 100%;
      }

      .c47 {
        grid-column: span 6;
        max-width: 100%;
      }

      @media (max-width:68.75rem) {
        .c18 {
          grid-column: span 12;
        }
      }

      @media (max-width:34.375rem) {
        .c18 {
          grid-column: span;
        }
      }

      @media (max-width:68.75rem) {
        .c29 {
          grid-column: span;
        }
      }

      @media (max-width:34.375rem) {
        .c29 {
          grid-column: span 12;
        }
      }

      @media (max-width:68.75rem) {
        .c47 {
          grid-column: span;
        }
      }

      @media (max-width:34.375rem) {
        .c47 {
          grid-column: span 12;
        }
      }

      <main
        aria-busy="false"
        aria-labelledby="main-content-title"
        class="c0"
        id="main-content"
        tabindex="-1"
      >
        <form
          action="#"
          novalidate=""
        >
          <div
            style="height: 0px;"
          >
            <div
              class="c1 c2"
              data-strapi-header="true"
            >
              <div
                class="c1 c3"
              >
                <div
                  class="c1 c4"
                >
                  <h1
                    class="c5 c6"
                  >
                    Advanced Settings
                  </h1>
                </div>
                <button
                  aria-disabled="false"
                  class="c7 c8"
                  type="submit"
                >
                  <div
                    aria-hidden="true"
                    class="c1 c9 c10"
                  >
                    <svg
                      fill="none"
                      height="1em"
                      viewBox="0 0 24 24"
                      width="1em"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20.727 2.97a.2.2 0 01.286 0l2.85 2.89a.2.2 0 010 .28L9.554 20.854a.2.2 0 01-.285 0l-9.13-9.243a.2.2 0 010-.281l2.85-2.892a.2.2 0 01.284 0l6.14 6.209L20.726 2.97z"
                        fill="#212134"
                      />
                    </svg>
                  </div>
                  <span
                    class="c5 c11"
                  >
                    Save
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div
            class="c1 c12"
          >
            <div
              class="c1 c13"
            >
              <div
                class="c1 c14 c15"
                spacing="4"
              >
                <h2
                  class="c5 c16"
                >
                  Settings
                </h2>
                <div
                  class="c1 c17"
                >
                  <div
                    class="c18"
                  >
                    <div
                      class="c1 "
                    >
                      <div>
                        <div
                          class="c1 c14 c19"
                          spacing="1"
                        >
                          <label
                            class="c5 c11"
                            for="select-1"
                          >
                            <div
                              class="c1 c4"
                            >
                              Default role for authenticated users
                            </div>
                          </label>
                          <div
                            class="c1 c4 c20"
                          >
                            <button
                              aria-describedby="select-1-hint"
                              aria-disabled="false"
                              aria-expanded="false"
                              aria-haspopup="listbox"
                              aria-labelledby="select-1 select-1-label select-1-content"
                              class="c21"
                              id="select-1"
                              type="button"
                            />
                            <div
                              class="c1 c3 c22"
                            >
                              <div
                                class="c1 c4"
                              >
                                <div
                                  class="c1 c23"
                                >
                                  <span
                                    class="c5 c24"
                                    id="select-1-content"
                                  >
                                    Authenticated
                                  </span>
                                </div>
                              </div>
                              <div
                                class="c1 c4"
                              >
                                <button
                                  aria-hidden="true"
                                  class="c1 c25 c26 c27"
                                  tabindex="-1"
                                  title="Carret Down Button"
                                  type="button"
                                >
                                  <svg
                                    fill="none"
                                    height="1em"
                                    viewBox="0 0 14 8"
                                    width="1em"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      clip-rule="evenodd"
                                      d="M14 .889a.86.86 0 01-.26.625L7.615 7.736A.834.834 0 017 8a.834.834 0 01-.615-.264L.26 1.514A.861.861 0 010 .889c0-.24.087-.45.26-.625A.834.834 0 01.875 0h12.25c.237 0 .442.088.615.264a.86.86 0 01.26.625z"
                                      fill="#32324D"
                                      fill-rule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          <p
                            class="c5 c28"
                            id="select-1-hint"
                          >
                            It will attach the new authenticated user to the selected role.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c29"
                  >
                    <div
                      class="c1 "
                    >
                      <div
                        class="c30"
                      >
                        <div
                          class="c31 c32"
                          spacing="1"
                        >
                          <div
                            class="c33"
                          >
                            <label
                              class="c34"
                              for="toggleinput-1"
                            >
                              <div
                                class="c33"
                              >
                                One account per email address
                              </div>
                            </label>
                          </div>
                          <label
                            class="c35"
                          >
                            <div
                              class="c36"
                            >
                              One account per email address
                            </div>
                            <div
                              class="c37 c38"
                              display="flex"
                            >
                              <div
                                aria-hidden="true"
                                class="c39 c40 c41"
                              >
                                <span
                                  class="c42"
                                >
                                  False
                                </span>
                              </div>
                              <div
                                aria-hidden="true"
                                class="c39 c40 c43"
                              >
                                <span
                                  class="c44"
                                >
                                  True
                                </span>
                              </div>
                              <input
                                aria-disabled="false"
                                aria-required="false"
                                class="c45"
                                id="toggleinput-1"
                                name="unique_email"
                                type="checkbox"
                              />
                            </div>
                          </label>
                          <p
                            class="c46"
                            id="toggleinput-1-hint"
                          >
                            Disallow the user to create multiple accounts using the same email address with different authentication providers.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c29"
                  >
                    <div
                      class="c1 "
                    >
                      <div
                        class="c30"
                      >
                        <div
                          class="c31 c32"
                          spacing="1"
                        >
                          <div
                            class="c33"
                          >
                            <label
                              class="c34"
                              for="toggleinput-2"
                            >
                              <div
                                class="c33"
                              >
                                Enable sign-ups
                              </div>
                            </label>
                          </div>
                          <label
                            class="c35"
                          >
                            <div
                              class="c36"
                            >
                              Enable sign-ups
                            </div>
                            <div
                              class="c37 c38"
                              display="flex"
                            >
                              <div
                                aria-hidden="true"
                                class="c39 c40 c41"
                              >
                                <span
                                  class="c42"
                                >
                                  False
                                </span>
                              </div>
                              <div
                                aria-hidden="true"
                                class="c39 c40 c43"
                              >
                                <span
                                  class="c44"
                                >
                                  True
                                </span>
                              </div>
                              <input
                                aria-disabled="false"
                                aria-required="false"
                                class="c45"
                                id="toggleinput-2"
                                name="allow_register"
                                type="checkbox"
                              />
                            </div>
                          </label>
                          <p
                            class="c46"
                            id="toggleinput-2-hint"
                          >
                            When disabled (OFF), the registration process is forbidden. No one can subscribe anymore no matter the used provider.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c47"
                  >
                    <div
                      class="c1 "
                    >
                      <div>
                        <div>
                          <div
                            class="c31 c32"
                            spacing="1"
                          >
                            <label
                              class="c34"
                              for="email_reset_password"
                            >
                              <div
                                class="c33"
                              >
                                Reset password page
                              </div>
                            </label>
                            <div
                              class="c48 c49"
                            >
                              <input
                                aria-describedby="email_reset_password-hint"
                                aria-disabled="false"
                                aria-invalid="false"
                                aria-required="false"
                                class="c50"
                                id="email_reset_password"
                                name="email_reset_password"
                                placeholder="ex: https://youtfrontend.com/reset-password"
                                type="text"
                                value="https://cat-bounce.com/"
                              />
                            </div>
                            <p
                              class="c46"
                              id="email_reset_password-hint"
                            >
                              URL of your application's reset password page.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c29"
                  >
                    <div
                      class="c1 "
                    >
                      <div
                        class="c30"
                      >
                        <div
                          class="c31 c32"
                          spacing="1"
                        >
                          <div
                            class="c33"
                          >
                            <label
                              class="c34"
                              for="toggleinput-3"
                            >
                              <div
                                class="c33"
                              >
                                Enable email confirmation
                              </div>
                            </label>
                          </div>
                          <label
                            class="c35"
                          >
                            <div
                              class="c36"
                            >
                              Enable email confirmation
                            </div>
                            <div
                              class="c37 c38"
                              display="flex"
                            >
                              <div
                                aria-hidden="true"
                                class="c39 c40 c41"
                              >
                                <span
                                  class="c42"
                                >
                                  False
                                </span>
                              </div>
                              <div
                                aria-hidden="true"
                                class="c39 c40 c43"
                              >
                                <span
                                  class="c44"
                                >
                                  True
                                </span>
                              </div>
                              <input
                                aria-disabled="false"
                                aria-required="false"
                                class="c45"
                                id="toggleinput-3"
                                name="email_confirmation"
                                type="checkbox"
                              />
                            </div>
                          </label>
                          <p
                            class="c46"
                            id="toggleinput-3-hint"
                          >
                            When enabled (ON), new registered users receive a confirmation email.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c47"
                  >
                    <div
                      class="c1 "
                    >
                      <div>
                        <div>
                          <div
                            class="c31 c32"
                            spacing="1"
                          >
                            <label
                              class="c34"
                              for="email_confirmation_redirection"
                            >
                              <div
                                class="c33"
                              >
                                Redirection url
                              </div>
                            </label>
                            <div
                              class="c48 c51"
                              disabled=""
                            >
                              <input
                                aria-describedby="email_confirmation_redirection-hint"
                                aria-disabled="true"
                                aria-invalid="false"
                                aria-required="false"
                                class="c52"
                                id="email_confirmation_redirection"
                                name="email_confirmation_redirection"
                                placeholder="ex: https://youtfrontend.com/email-confirmation"
                                type="text"
                                value=""
                              />
                            </div>
                            <p
                              class="c46"
                              id="email_confirmation_redirection-hint"
                            >
                              After you confirmed your email, choose where you will be redirected.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    `);
  });
});
