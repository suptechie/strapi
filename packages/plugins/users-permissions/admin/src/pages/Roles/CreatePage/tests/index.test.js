import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ThemeProvider, lightTheme } from '@strapi/parts';
import { Router, Switch, Route } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { createMemoryHistory } from 'history';
import pluginId from '../../../../pluginId';
import RolesCreatePage from '..';
import server from './server';

jest.mock('@strapi/helper-plugin', () => {
  // Make sure the references of the mock functions stay the same, otherwise we get an endless loop
  const mockToggleNotification = jest.fn();
  const mockUseNotification = jest.fn(() => {
    return mockToggleNotification;
  });

  return {
    ...jest.requireActual('@strapi/helper-plugin'),
    useNotification: mockUseNotification,
    useOverlayBlocker: jest.fn(() => ({ lockApp: jest.fn(), unlockApp: jest.fn() })),
  };
});

function makeAndRenderApp() {
  const history = createMemoryHistory();
  const app = (
    <IntlProvider locale="en" messages={{}} textComponent="span">
      <ThemeProvider theme={lightTheme}>
        <Router history={history}>
          <Switch>
            <Route path={`/settings/${pluginId}/roles/new`} component={RolesCreatePage} />
          </Switch>
        </Router>
      </ThemeProvider>
    </IntlProvider>
  );
  const renderResult = render(app);
  history.push(`/settings/${pluginId}/roles/new`);

  return renderResult;
}

describe('Admin | containers | RoleCreatePage', () => {
  beforeAll(() => server.listen());

  beforeEach(() => jest.clearAllMocks());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  it('renders users-permissions create role and matches snapshot', async () => {
    const { container, getByText, getByRole } = makeAndRenderApp();
    await waitFor(() =>
      expect(getByRole('heading', { name: /create a role/i })).toBeInTheDocument()
    );
    await waitFor(() => {
      expect(
        getByText(/define all allowed actions for the api::address plugin/i)
      ).toBeInTheDocument();
    });

    expect(container.firstChild).toMatchInlineSnapshot(`
      .c1 {
        background: #f6f6f9;
        padding-top: 56px;
        padding-right: 56px;
        padding-bottom: 56px;
        padding-left: 56px;
      }

      .c14 {
        padding-right: 56px;
        padding-left: 56px;
      }

      .c2 {
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
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c3 {
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

      .c4 {
        font-weight: 600;
        font-size: 2rem;
        line-height: 1.25;
        color: #32324d;
      }

      .c12 {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #666687;
      }

      .c13 {
        font-size: 1rem;
        line-height: 1.5;
      }

      .c0 {
        outline: none;
      }

      .c11 {
        font-weight: 500;
        font-size: 0.75rem;
        line-height: 1.33;
        color: #32324d;
      }

      .c8 {
        padding-right: 8px;
      }

      .c5 {
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

      .c5 svg {
        height: 12px;
        width: 12px;
      }

      .c5 svg > g,
      .c5 svg path {
        fill: #ffffff;
      }

      .c5[aria-disabled='true'] {
        pointer-events: none;
      }

      .c5:after {
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

      .c5:focus-visible {
        outline: none;
      }

      .c5:focus-visible:after {
        border-radius: 8px;
        content: '';
        position: absolute;
        top: -5px;
        bottom: -5px;
        left: -5px;
        right: -5px;
        border: 2px solid #4945ff;
      }

      .c9 {
        height: 100%;
      }

      .c6 {
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        padding: 8px 16px;
        background: #4945ff;
        border: none;
        border: 1px solid #4945ff;
        background: #4945ff;
      }

      .c6 .c7 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c6 .c10 {
        color: #ffffff;
      }

      .c6[aria-disabled='true'] {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c6[aria-disabled='true'] .c10 {
        color: #666687;
      }

      .c6[aria-disabled='true'] svg > g,
      .c6[aria-disabled='true'] svg path {
        fill: #666687;
      }

      .c6[aria-disabled='true']:active {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c6[aria-disabled='true']:active .c10 {
        color: #666687;
      }

      .c6[aria-disabled='true']:active svg > g,
      .c6[aria-disabled='true']:active svg path {
        fill: #666687;
      }

      .c6:hover {
        border: 1px solid #7b79ff;
        background: #7b79ff;
      }

      .c6:active {
        border: 1px solid #4945ff;
        background: #4945ff;
      }

      .c15 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c15 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c15 > * + * {
        margin-top: 32px;
      }

      .c17 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c17 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c17 > * + * {
        margin-top: 16px;
      }

      .c37 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c37 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c37 > * + * {
        margin-top: 8px;
      }

      .c16 {
        background: #ffffff;
        padding-top: 24px;
        padding-right: 32px;
        padding-bottom: 24px;
        padding-left: 32px;
        border-radius: 4px;
        box-shadow: 0px 1px 4px rgba(33,33,52,0.1);
      }

      .c23 {
        font-weight: 500;
        font-size: 0.75rem;
        line-height: 1.33;
        color: #32324d;
      }

      .c22 {
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

      .c24 {
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
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c26 {
        border: none;
        border-radius: 4px;
        padding-left: 16px;
        padding-right: 16px;
        color: #32324d;
        font-weight: 400;
        font-size: 0.875rem;
        display: block;
        width: 100%;
      }

      .c26::-webkit-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c26::-moz-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c26:-ms-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c26::placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c26[aria-disabled='true'] {
        background: inherit;
        color: inherit;
      }

      .c26:focus {
        outline: none;
        box-shadow: none;
      }

      .c25 {
        border: 1px solid #dcdce4;
        border-radius: 4px;
        background: #ffffff;
        height: 2.5rem;
        outline: none;
        box-shadow: 0;
        -webkit-transition-property: border-color,box-shadow,fill;
        transition-property: border-color,box-shadow,fill;
        -webkit-transition-duration: 0.2s;
        transition-duration: 0.2s;
      }

      .c25:focus-within {
        border: 1px solid #4945ff;
        box-shadow: #4945ff 0px 0px 0px 2px;
      }

      .c21 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c21 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c21 > * + * {
        margin-top: 4px;
      }

      .c30 {
        font-weight: 500;
        font-size: 0.75rem;
        line-height: 1.33;
        color: #32324d;
      }

      .c29 {
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

      .c31 {
        border: 1px solid #dcdce4;
        border-radius: 4px;
        padding-left: 16px;
        padding-right: 16px;
        padding-top: 12px;
        padding-bottom: 12px;
        background: #ffffff;
        outline: none;
        box-shadow: 0;
        -webkit-transition-property: border-color,box-shadow,fill;
        transition-property: border-color,box-shadow,fill;
        -webkit-transition-duration: 0.2s;
        transition-duration: 0.2s;
      }

      .c31:focus-within {
        border: 1px solid #4945ff;
        box-shadow: #4945ff 0px 0px 0px 2px;
      }

      .c32 {
        display: block;
        width: 100%;
        font-weight: 400;
        font-size: 0.875rem;
        border: none;
        color: #32324d;
        resize: none;
      }

      .c32::-webkit-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c32::-moz-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c32:-ms-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c32::placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c32:focus-within {
        outline: none;
      }

      .c28 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c28 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c28 > * + * {
        margin-top: 4px;
      }

      .c27 textarea {
        height: 5rem;
        line-height: 1.25rem;
      }

      .c27 textarea::-webkit-input-placeholder {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #8e8ea9;
        opacity: 1;
      }

      .c27 textarea::-moz-placeholder {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #8e8ea9;
        opacity: 1;
      }

      .c27 textarea:-ms-input-placeholder {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #8e8ea9;
        opacity: 1;
      }

      .c27 textarea::placeholder {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #8e8ea9;
        opacity: 1;
      }

      .c18 {
        font-weight: 500;
        font-size: 1rem;
        line-height: 1.25;
        color: #32324d;
      }

      .c38 {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #666687;
      }

      .c33 {
        background: #ffffff;
        border-radius: 4px;
        box-shadow: 0px 1px 4px rgba(33,33,52,0.1);
      }

      .c36 {
        padding-top: 24px;
        padding-right: 32px;
        padding-bottom: 24px;
        padding-left: 32px;
      }

      .c54 {
        background: #eaeaef;
        padding-top: 24px;
        padding-right: 32px;
        padding-bottom: 24px;
        padding-left: 32px;
      }

      .c19 {
        display: grid;
        grid-template-columns: repeat(12,1fr);
        gap: 16px;
      }

      .c34 {
        display: grid;
        grid-template-columns: repeat(12,1fr);
        gap: 0px;
      }

      .c20 {
        grid-column: span 6;
      }

      .c35 {
        grid-column: span 7;
      }

      .c53 {
        grid-column: span 5;
      }

      .c47 {
        font-weight: 500;
        font-size: 1rem;
        line-height: 1.25;
        color: #4a4a6a;
      }

      .c49 {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #666687;
      }

      .c40 {
        border-radius: 4px;
      }

      .c42 {
        background: #f6f6f9;
        padding: 24px;
        border-radius: 4px;
      }

      .c45 {
        padding-right: 24px;
      }

      .c51 {
        background: #dcdce4;
      }

      .c52 {
        height: 2rem;
        width: 2rem;
        border-radius: 50%;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        -webkit-box-pack: center;
        -webkit-justify-content: center;
        -ms-flex-pack: center;
        justify-content: center;
      }

      .c52 svg {
        height: 0.375rem;
        width: 0.6875rem;
      }

      .c52 svg path {
        fill: #666687;
      }

      .c41 {
        border: 1px solid transparent;
        overflow: hidden;
      }

      .c41:hover {
        border: 1px solid #4945ff;
      }

      .c41:hover .c46 {
        color: #271fe0;
      }

      .c41:hover .c48 {
        color: #4945ff;
      }

      .c41:hover > .c39 {
        background: #f0f0ff;
      }

      .c41:hover .c50 {
        background: #d9d8ff;
      }

      .c41:hover .c50 svg path {
        fill: #4945ff;
      }

      .c44 {
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
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c43 {
        border: none;
        background: transparent;
        display: block;
        width: 100%;
        text-align: unset;
        padding: 0;
      }

      @media (max-width:68.75rem) {
        .c20 {
          grid-column: span;
        }
      }

      @media (max-width:34.375rem) {
        .c20 {
          grid-column: span;
        }
      }

      @media (max-width:68.75rem) {
        .c35 {
          grid-column: span;
        }
      }

      @media (max-width:34.375rem) {
        .c35 {
          grid-column: span;
        }
      }

      @media (max-width:68.75rem) {
        .c53 {
          grid-column: span;
        }
      }

      @media (max-width:34.375rem) {
        .c53 {
          grid-column: span;
        }
      }

      <main
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
              class="c1"
              data-strapi-header="true"
            >
              <div
                class="c2"
              >
                <div
                  class="c3"
                >
                  <h1
                    class="c4"
                    id="main-content-title"
                  >
                    Create a role
                  </h1>
                </div>
                <button
                  aria-disabled="false"
                  class="c5 c6"
                  type="submit"
                >
                  <div
                    aria-hidden="true"
                    class="c7 c8 c9"
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
                    class="c10 c11"
                  >
                    Save
                  </span>
                </button>
              </div>
              <p
                class="c12 c13"
              >
                Define the rights given to the role
              </p>
            </div>
          </div>
          <div
            class="c14"
          >
            <div
              class="c15"
            >
              <div
                class="c16"
              >
                <div
                  class="c17"
                >
                  <h2
                    class="c18"
                  >
                    Role details
                  </h2>
                  <div
                    class="c19"
                  >
                    <div
                      class="c20"
                    >
                      <div
                        class=""
                      >
                        <div>
                          <div>
                            <div
                              class="c21"
                            >
                              <div
                                class="c22"
                              >
                                <label
                                  class="c23"
                                  for="textinput-1"
                                >
                                  Name
                                </label>
                              </div>
                              <div
                                class="c24 c25"
                              >
                                <input
                                  aria-disabled="false"
                                  aria-invalid="false"
                                  class="c26"
                                  id="textinput-1"
                                  name="name"
                                  value=""
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      class="c20"
                    >
                      <div
                        class=""
                      >
                        <div
                          class="c27"
                        >
                          <div>
                            <div
                              class="c28"
                            >
                              <div
                                class="c29"
                              >
                                <label
                                  class="c30"
                                  for="textarea-1"
                                >
                                  Description
                                </label>
                              </div>
                              <div
                                class="c31"
                              >
                                <textarea
                                  aria-invalid="false"
                                  class="c32"
                                  id="textarea-1"
                                  name="description"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                class="c33 c34"
              >
                <div
                  class="c35"
                >
                  <div
                    class="c36"
                  >
                    <div
                      class="c17"
                    >
                      <div
                        class="c37"
                      >
                        <h2
                          class="c18"
                        >
                          Permissions
                        </h2>
                        <p
                          class="c38"
                        >
                          Only actions bound by a route are listed below.
                        </p>
                      </div>
                      <div
                        class="c39 c40 c41"
                      >
                        <div
                          class="c39 c42"
                        >
                          <button
                            aria-controls="accordion-content-accordion-1"
                            aria-expanded="false"
                            aria-labelledby="accordion-label-accordion-1"
                            class="c43"
                            data-strapi-accordion-toggle="true"
                            type="button"
                          >
                            <div
                              class="c39 c44"
                            >
                              <div
                                class="c39 c45"
                              >
                                <span
                                  class="c46 c47"
                                  id="accordion-label-accordion-1"
                                >
                                  Address
                                </span>
                                <p
                                  class="c48 c49"
                                  id="accordion-desc-accordion-1"
                                >
                                  Define all allowed actions for the api::address plugin.
                                </p>
                              </div>
                              <span
                                aria-hidden="true"
                                class="c39 c50 c51 c52"
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
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="c53"
                >
                  <div
                    class="c54"
                    style="min-height: 100%;"
                  >
                    <div
                      class="c37"
                    >
                      <h3
                        class="c18"
                      >
                        Advanced settings
                      </h3>
                      <p
                        class="c38"
                      >
                        Select the application's actions or the plugin's actions and click on the cog icon to display the bound route
                      </p>
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
