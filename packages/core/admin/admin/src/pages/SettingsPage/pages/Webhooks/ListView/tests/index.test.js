import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { ThemeProvider, lightTheme } from '@strapi/design-system';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { useRBAC } from '@strapi/helper-plugin';
import ListView from '../index';
import server from './server';

jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useNotification: jest.fn(),
  useRBAC: jest.fn(),
  useFocusWhenNavigate: jest.fn(),
}));

const history = createMemoryHistory();

const App = (
  <ThemeProvider theme={lightTheme}>
    <IntlProvider locale="en" messages={{}} defaultLocale="en" textComponent="span">
      <Router history={history}>
        <ListView />
      </Router>
    </IntlProvider>
  </ThemeProvider>
);

describe('Admin | containers | ListView', () => {
  beforeAll(() => server.listen());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  it('renders and matches the snapshot', async () => {
    useRBAC.mockImplementation(() => ({
      isLoading: false,
      allowedActions: { canUpdate: true, canCreate: true, canRead: true, canDelete: true },
    }));

    const {
      container: { firstChild },
    } = render(App);

    await waitFor(() => {
      expect(screen.getByText('http:://strapi.io')).toBeInTheDocument();
    });

    expect(firstChild).toMatchInlineSnapshot(`
      .c7 {
        font-weight: 600;
        font-size: 2rem;
        line-height: 1.25;
        color: #32324d;
      }

      .c14 {
        font-size: 1rem;
        line-height: 1.5;
        color: #666687;
      }

      .c29 {
        font-weight: 600;
        font-size: 0.6875rem;
        line-height: 1.45;
        text-transform: uppercase;
        color: #666687;
      }

      .c33 {
        font-size: 0.875rem;
        line-height: 1.43;
        font-weight: 500;
        color: #32324d;
      }

      .c34 {
        font-size: 0.875rem;
        line-height: 1.43;
        color: #32324d;
      }

      .c50 {
        font-size: 0.75rem;
        line-height: 1.33;
        font-weight: 600;
        color: #4945ff;
      }

      .c1 {
        padding-bottom: 56px;
      }

      .c4 {
        background: #f6f6f9;
        padding-top: 40px;
        padding-right: 56px;
        padding-bottom: 40px;
        padding-left: 56px;
      }

      .c15 {
        padding-right: 56px;
        padding-left: 56px;
      }

      .c16 {
        background: #ffffff;
        border-radius: 4px;
        box-shadow: 0px 1px 4px rgba(33,33,52,0.1);
      }

      .c18 {
        position: relative;
      }

      .c20 {
        padding-right: 24px;
        padding-left: 24px;
      }

      .c28 {
        width: 20%;
      }

      .c30 {
        width: 60%;
      }

      .c38 {
        color: #328048;
        padding-left: 8px;
      }

      .c42 {
        color: #d02b20;
        padding-left: 8px;
      }

      .c43 {
        background: #eaeaef;
      }

      .c45 {
        background: #f0f0ff;
        padding: 20px;
      }

      .c47 {
        background: #d9d8ff;
      }

      .c49 {
        padding-left: 12px;
      }

      .c5 {
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

      .c6 {
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

      .c39 {
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
        gap: 4px;
      }

      .c40 {
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

      .c40 svg {
        height: 12px;
        width: 12px;
      }

      .c40 svg > g,
      .c40 svg path {
        fill: #ffffff;
      }

      .c40[aria-disabled='true'] {
        pointer-events: none;
      }

      .c40:after {
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

      .c40:focus-visible {
        outline: none;
      }

      .c40:focus-visible:after {
        border-radius: 8px;
        content: '';
        position: absolute;
        top: -5px;
        bottom: -5px;
        left: -5px;
        right: -5px;
        border: 2px solid #4945ff;
      }

      .c26 {
        height: 18px;
        min-width: 18px;
        margin: 0;
        border-radius: 4px;
        border: 1px solid #c0c0cf;
        -webkit-appearance: none;
        background-color: #ffffff;
        cursor: pointer;
      }

      .c26:checked {
        background-color: #4945ff;
        border: 1px solid #4945ff;
      }

      .c26:checked:after {
        content: '';
        display: block;
        position: relative;
        background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEwIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGgKICAgIGQ9Ik04LjU1MzIzIDAuMzk2OTczQzguNjMxMzUgMC4zMTYzNTUgOC43NjA1MSAwLjMxNTgxMSA4LjgzOTMxIDAuMzk1NzY4TDkuODYyNTYgMS40MzQwN0M5LjkzODkzIDEuNTExNTcgOS45MzkzNSAxLjYzNTkgOS44NjM0OSAxLjcxMzlMNC4wNjQwMSA3LjY3NzI0QzMuOTg1OSA3Ljc1NzU1IDMuODU3MDcgNy43NTgwNSAzLjc3ODM0IDcuNjc4MzRMMC4xMzg2NiAzLjk5MzMzQzAuMDYxNzc5OCAzLjkxNTQ5IDAuMDYxNzEwMiAzLjc5MDMyIDAuMTM4NTA0IDMuNzEyNEwxLjE2MjEzIDIuNjczNzJDMS4yNDAzOCAyLjU5NDMyIDEuMzY4NDMgMi41OTQyMiAxLjQ0NjggMi42NzM0OEwzLjkyMTc0IDUuMTc2NDdMOC41NTMyMyAwLjM5Njk3M1oiCiAgICBmaWxsPSJ3aGl0ZSIKICAvPgo8L3N2Zz4=) no-repeat no-repeat center center;
        width: 10px;
        height: 10px;
        left: 50%;
        top: 50%;
        -webkit-transform: translateX(-50%) translateY(-50%);
        -ms-transform: translateX(-50%) translateY(-50%);
        transform: translateX(-50%) translateY(-50%);
      }

      .c26:checked:disabled:after {
        background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEwIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGgKICAgIGQ9Ik04LjU1MzIzIDAuMzk2OTczQzguNjMxMzUgMC4zMTYzNTUgOC43NjA1MSAwLjMxNTgxMSA4LjgzOTMxIDAuMzk1NzY4TDkuODYyNTYgMS40MzQwN0M5LjkzODkzIDEuNTExNTcgOS45MzkzNSAxLjYzNTkgOS44NjM0OSAxLjcxMzlMNC4wNjQwMSA3LjY3NzI0QzMuOTg1OSA3Ljc1NzU1IDMuODU3MDcgNy43NTgwNSAzLjc3ODM0IDcuNjc4MzRMMC4xMzg2NiAzLjk5MzMzQzAuMDYxNzc5OCAzLjkxNTQ5IDAuMDYxNzEwMiAzLjc5MDMyIDAuMTM4NTA0IDMuNzEyNEwxLjE2MjEzIDIuNjczNzJDMS4yNDAzOCAyLjU5NDMyIDEuMzY4NDMgMi41OTQyMiAxLjQ0NjggMi42NzM0OEwzLjkyMTc0IDUuMTc2NDdMOC41NTMyMyAwLjM5Njk3M1oiCiAgICBmaWxsPSIjOEU4RUE5IgogIC8+Cjwvc3ZnPg==) no-repeat no-repeat center center;
      }

      .c26:disabled {
        background-color: #dcdce4;
        border: 1px solid #c0c0cf;
      }

      .c26:indeterminate {
        background-color: #4945ff;
        border: 1px solid #4945ff;
      }

      .c26:indeterminate:after {
        content: '';
        display: block;
        position: relative;
        color: white;
        height: 2px;
        width: 10px;
        background-color: #ffffff;
        left: 50%;
        top: 50%;
        -webkit-transform: translateX(-50%) translateY(-50%);
        -ms-transform: translateX(-50%) translateY(-50%);
        transform: translateX(-50%) translateY(-50%);
      }

      .c26:indeterminate:disabled {
        background-color: #dcdce4;
        border: 1px solid #c0c0cf;
      }

      .c26:indeterminate:disabled:after {
        background-color: #8e8ea9;
      }

      .c31 {
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

      .c44 {
        height: 1px;
        border: none;
        -webkit-flex-shrink: 0;
        -ms-flex-negative: 0;
        flex-shrink: 0;
        margin: 0;
      }

      .c41 {
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
        height: 2rem;
        width: 2rem;
        border: none;
      }

      .c41 svg > g,
      .c41 svg path {
        fill: #8e8ea9;
      }

      .c41:hover svg > g,
      .c41:hover svg path {
        fill: #666687;
      }

      .c41:active svg > g,
      .c41:active svg path {
        fill: #a5a5ba;
      }

      .c41[aria-disabled='true'] {
        background-color: #eaeaef;
      }

      .c41[aria-disabled='true'] svg path {
        fill: #666687;
      }

      .c0 {
        display: grid;
        grid-template-columns: 1fr;
      }

      .c2 {
        overflow-x: hidden;
      }

      .c3:focus-visible {
        outline: none;
      }

      .c37 {
        background: #ee5e52;
        border: none;
        border-radius: 16px;
        position: relative;
        height: 1.5rem;
        width: 2.5rem;
      }

      .c37 span {
        font-size: 0;
      }

      .c37:before {
        content: '';
        background: #ffffff;
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        position: absolute;
        -webkit-transition: all 0.5s;
        transition: all 0.5s;
        left: 4px;
        top: 4px;
      }

      .c35 {
        background: transparent;
        padding: 0;
        border: none;
      }

      .c35[aria-checked='true'] .c36 {
        background: #5cb176;
      }

      .c35[aria-checked='true'] .c36:before {
        -webkit-transform: translateX(1rem);
        -ms-transform: translateX(1rem);
        transform: translateX(1rem);
      }

      .c17 {
        overflow: hidden;
        border: 1px solid #eaeaef;
      }

      .c22 {
        width: 100%;
        white-space: nowrap;
      }

      .c19:before {
        background: linear-gradient(90deg,#c0c0cf 0%,rgba(0,0,0,0) 100%);
        opacity: 0.2;
        position: absolute;
        height: 100%;
        box-shadow: 0px 1px 4px rgba(33,33,52,0.1);
        width: 8px;
        left: 0;
      }

      .c19:after {
        background: linear-gradient(270deg,#c0c0cf 0%,rgba(0,0,0,0) 100%);
        opacity: 0.2;
        position: absolute;
        height: 100%;
        box-shadow: 0px 1px 4px rgba(33,33,52,0.1);
        width: 8px;
        right: 0;
        top: 0;
      }

      .c21 {
        overflow-x: auto;
      }

      .c32 tr:last-of-type {
        border-bottom: none;
      }

      .c23 {
        border-bottom: 1px solid #eaeaef;
      }

      .c24 {
        border-bottom: 1px solid #eaeaef;
      }

      .c24 td,
      .c24 th {
        padding: 16px;
      }

      .c24 td:first-of-type,
      .c24 th:first-of-type {
        padding: 0 4px;
      }

      .c24 th {
        padding-top: 0;
        padding-bottom: 0;
        height: 3.5rem;
      }

      .c25 {
        vertical-align: middle;
        text-align: left;
        color: #666687;
        outline-offset: -4px;
      }

      .c25 input {
        vertical-align: sub;
      }

      .c27 svg {
        height: 0.25rem;
      }

      .c48 {
        height: 1.5rem;
        width: 1.5rem;
        border-radius: 50%;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: center;
        -webkit-justify-content: center;
        -ms-flex-pack: center;
        justify-content: center;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c48 svg {
        height: 0.625rem;
        width: 0.625rem;
      }

      .c48 svg path {
        fill: #4945ff;
      }

      .c46 {
        border-radius: 0 0 4px 4px;
        display: block;
        width: 100%;
        border: none;
      }

      .c11 {
        padding-right: 8px;
      }

      .c13 {
        font-size: 0.75rem;
        line-height: 1.33;
        font-weight: 600;
        color: #32324d;
      }

      .c8 {
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

      .c8 svg {
        height: 12px;
        width: 12px;
      }

      .c8 svg > g,
      .c8 svg path {
        fill: #ffffff;
      }

      .c8[aria-disabled='true'] {
        pointer-events: none;
      }

      .c8:after {
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

      .c8:focus-visible {
        outline: none;
      }

      .c8:focus-visible:after {
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
        padding: 8px 16px;
        background: #4945ff;
        border: 1px solid #4945ff;
        border-radius: 4px;
        display: -webkit-inline-box;
        display: -webkit-inline-flex;
        display: -ms-inline-flexbox;
        display: inline-flex;
        -webkit-text-decoration: none;
        text-decoration: none;
      }

      .c9 .c10 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c9 .c12 {
        color: #ffffff;
      }

      .c9[aria-disabled='true'] {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c9[aria-disabled='true'] .c12 {
        color: #666687;
      }

      .c9[aria-disabled='true'] svg > g,.c9[aria-disabled='true'] svg path {
        fill: #666687;
      }

      .c9[aria-disabled='true']:active {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c9[aria-disabled='true']:active .c12 {
        color: #666687;
      }

      .c9[aria-disabled='true']:active svg > g,.c9[aria-disabled='true']:active svg path {
        fill: #666687;
      }

      .c9:hover {
        border: 1px solid #7b79ff;
        background: #7b79ff;
      }

      .c9:active {
        border: 1px solid #4945ff;
        background: #4945ff;
      }

      .c9 svg > g,
      .c9 svg path {
        fill: #ffffff;
      }

      @media (prefers-reduced-motion:reduce) {
        .c37:before {
          -webkit-transition: none;
          transition: none;
        }
      }

      <div
        class="c0"
      >
        <div
          class="c1 c2"
        >
          <main
            aria-busy="false"
            aria-labelledby="main-content-title"
            class="c3"
            id="main-content"
            tabindex="-1"
          >
            <div
              style="height: 0px;"
            >
              <div
                class="c4"
                data-strapi-header="true"
              >
                <div
                  class="c5"
                >
                  <div
                    class="c6"
                  >
                    <h1
                      class="c7"
                    >
                      Webhooks
                    </h1>
                  </div>
                  <a
                    aria-disabled="false"
                    class="c8 c9"
                    href="//create"
                    variant="default"
                  >
                    <div
                      aria-hidden="true"
                      class="c10 c11"
                    >
                      <svg
                        fill="none"
                        height="1em"
                        viewBox="0 0 24 24"
                        width="1em"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M24 13.604a.3.3 0 01-.3.3h-9.795V23.7a.3.3 0 01-.3.3h-3.21a.3.3 0 01-.3-.3v-9.795H.3a.3.3 0 01-.3-.3v-3.21a.3.3 0 01.3-.3h9.795V.3a.3.3 0 01.3-.3h3.21a.3.3 0 01.3.3v9.795H23.7a.3.3 0 01.3.3v3.21z"
                          fill="#212134"
                        />
                      </svg>
                    </div>
                    <span
                      class="c12 c13"
                    >
                      Create new webhook
                    </span>
                  </a>
                </div>
                <p
                  class="c14"
                >
                  Get POST changes notifications
                </p>
              </div>
            </div>
            <div
              class="c15"
            >
              <div
                class="c16 c17"
              >
                <div
                  class="c18 c19"
                >
                  <div
                    class="c20 c21"
                  >
                    <table
                      aria-colcount="5"
                      aria-rowcount="3"
                      class="c22"
                      role="grid"
                    >
                      <thead
                        class="c23"
                      >
                        <tr
                          aria-rowindex="1"
                          class="c24"
                        >
                          <th
                            aria-colindex="1"
                            class="c25"
                            role="gridcell"
                          >
                            <div
                              class="c6"
                            >
                              <div
                                class=""
                              >
                                <input
                                  aria-label="Select all entries"
                                  class="c26"
                                  tabindex="0"
                                  type="checkbox"
                                />
                              </div>
                              <span
                                class="c27"
                              />
                            </div>
                          </th>
                          <th
                            aria-colindex="2"
                            class="c28 c25"
                            role="gridcell"
                            tabindex="-1"
                          >
                            <div
                              class="c6"
                            >
                              <span
                                class="c29"
                              >
                                Name
                              </span>
                              <span
                                class="c27"
                              />
                            </div>
                          </th>
                          <th
                            aria-colindex="3"
                            class="c30 c25"
                            role="gridcell"
                            tabindex="-1"
                          >
                            <div
                              class="c6"
                            >
                              <span
                                class="c29"
                              >
                                URL
                              </span>
                              <span
                                class="c27"
                              />
                            </div>
                          </th>
                          <th
                            aria-colindex="4"
                            class="c28 c25"
                            role="gridcell"
                            tabindex="-1"
                          >
                            <div
                              class="c6"
                            >
                              <span
                                class="c29"
                              >
                                Status
                              </span>
                              <span
                                class="c27"
                              />
                            </div>
                          </th>
                          <th
                            aria-colindex="5"
                            class="c25"
                            role="gridcell"
                            tabindex="-1"
                          >
                            <div
                              class="c6"
                            >
                              <div
                                class="c31"
                              >
                                Actions
                              </div>
                              <span
                                class="c27"
                              />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody
                        class="c32"
                      >
                        <tr
                          aria-rowindex="2"
                          class="c24"
                          style="cursor: pointer;"
                        >
                          <td
                            aria-colindex="1"
                            aria-hidden="true"
                            class="c25"
                            role="button"
                          >
                            <div
                              class=""
                            >
                              <input
                                aria-label="Select test"
                                class="c26"
                                id="select"
                                name="select"
                                tabindex="-1"
                                type="checkbox"
                              />
                            </div>
                          </td>
                          <td
                            aria-colindex="2"
                            class="c25"
                            role="gridcell"
                            tabindex="-1"
                          >
                            <span
                              class="c33"
                            >
                              test
                            </span>
                          </td>
                          <td
                            aria-colindex="3"
                            class="c25"
                            role="gridcell"
                            tabindex="-1"
                          >
                            <span
                              class="c34"
                            >
                              http:://strapi.io
                            </span>
                          </td>
                          <td
                            aria-colindex="4"
                            class="c25"
                            role="gridcell"
                          >
                            <div
                              aria-hidden="true"
                              class="c6"
                              role="button"
                            >
                              <button
                                aria-checked="true"
                                aria-label="test Status"
                                class="c35"
                                role="switch"
                                tabindex="-1"
                                type="button"
                              >
                                <div
                                  class="c6"
                                >
                                  <div
                                    class="c36 c37"
                                  >
                                    <span>
                                      Enabled
                                    </span>
                                    <span>
                                      Disabled
                                    </span>
                                  </div>
                                  <span
                                    aria-hidden="true"
                                    class="c38"
                                  >
                                    Enabled
                                  </span>
                                </div>
                              </button>
                            </div>
                          </td>
                          <td
                            aria-colindex="5"
                            class="c25"
                            role="gridcell"
                          >
                            <div
                              aria-hidden="true"
                              class="c39"
                              role="button"
                            >
                              <span>
                                <button
                                  aria-disabled="false"
                                  aria-labelledby="1"
                                  class="c40 c41"
                                  tabindex="-1"
                                  type="button"
                                >
                                  <span
                                    class="c31"
                                  >
                                    Update
                                  </span>
                                  <svg
                                    aria-hidden="true"
                                    fill="none"
                                    focusable="false"
                                    height="1em"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      clip-rule="evenodd"
                                      d="M23.604 3.514c.528.528.528 1.36 0 1.887l-2.622 2.607-4.99-4.99L18.6.396a1.322 1.322 0 011.887 0l3.118 3.118zM0 24v-4.99l14.2-14.2 4.99 4.99L4.99 24H0z"
                                      fill="#212134"
                                      fill-rule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </span>
                              <span>
                                <button
                                  aria-disabled="false"
                                  aria-labelledby="2"
                                  class="c40 c41"
                                  id="delete-1"
                                  tabindex="-1"
                                  type="button"
                                >
                                  <span
                                    class="c31"
                                  >
                                    Delete
                                  </span>
                                  <svg
                                    aria-hidden="true"
                                    fill="none"
                                    focusable="false"
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
                                </button>
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr
                          aria-rowindex="3"
                          class="c24"
                          style="cursor: pointer;"
                        >
                          <td
                            aria-colindex="1"
                            aria-hidden="true"
                            class="c25"
                            role="button"
                          >
                            <div
                              class=""
                            >
                              <input
                                aria-label="Select test2"
                                class="c26"
                                id="select"
                                name="select"
                                tabindex="-1"
                                type="checkbox"
                              />
                            </div>
                          </td>
                          <td
                            aria-colindex="2"
                            class="c25"
                            role="gridcell"
                            tabindex="-1"
                          >
                            <span
                              class="c33"
                            >
                              test2
                            </span>
                          </td>
                          <td
                            aria-colindex="3"
                            class="c25"
                            role="gridcell"
                            tabindex="-1"
                          >
                            <span
                              class="c34"
                            >
                              http://me.io
                            </span>
                          </td>
                          <td
                            aria-colindex="4"
                            class="c25"
                            role="gridcell"
                          >
                            <div
                              aria-hidden="true"
                              class="c6"
                              role="button"
                            >
                              <button
                                aria-checked="false"
                                aria-label="test2 Status"
                                class="c35"
                                role="switch"
                                tabindex="-1"
                                type="button"
                              >
                                <div
                                  class="c6"
                                >
                                  <div
                                    class="c36 c37"
                                  >
                                    <span>
                                      Enabled
                                    </span>
                                    <span>
                                      Disabled
                                    </span>
                                  </div>
                                  <span
                                    aria-hidden="true"
                                    class="c42"
                                  >
                                    Disabled
                                  </span>
                                </div>
                              </button>
                            </div>
                          </td>
                          <td
                            aria-colindex="5"
                            class="c25"
                            role="gridcell"
                          >
                            <div
                              aria-hidden="true"
                              class="c39"
                              role="button"
                            >
                              <span>
                                <button
                                  aria-disabled="false"
                                  aria-labelledby="3"
                                  class="c40 c41"
                                  tabindex="-1"
                                  type="button"
                                >
                                  <span
                                    class="c31"
                                  >
                                    Update
                                  </span>
                                  <svg
                                    aria-hidden="true"
                                    fill="none"
                                    focusable="false"
                                    height="1em"
                                    viewBox="0 0 24 24"
                                    width="1em"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      clip-rule="evenodd"
                                      d="M23.604 3.514c.528.528.528 1.36 0 1.887l-2.622 2.607-4.99-4.99L18.6.396a1.322 1.322 0 011.887 0l3.118 3.118zM0 24v-4.99l14.2-14.2 4.99 4.99L4.99 24H0z"
                                      fill="#212134"
                                      fill-rule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </span>
                              <span>
                                <button
                                  aria-disabled="false"
                                  aria-labelledby="4"
                                  class="c40 c41"
                                  id="delete-2"
                                  tabindex="-1"
                                  type="button"
                                >
                                  <span
                                    class="c31"
                                  >
                                    Delete
                                  </span>
                                  <svg
                                    aria-hidden="true"
                                    fill="none"
                                    focusable="false"
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
                                </button>
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <hr
                    class="c43 c44"
                  />
                  <button
                    class="c45 c46"
                  >
                    <div
                      class="c6"
                    >
                      <div
                        aria-hidden="true"
                        class="c47 c48"
                      >
                        <svg
                          fill="none"
                          height="1em"
                          viewBox="0 0 24 24"
                          width="1em"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M24 13.604a.3.3 0 01-.3.3h-9.795V23.7a.3.3 0 01-.3.3h-3.21a.3.3 0 01-.3-.3v-9.795H.3a.3.3 0 01-.3-.3v-3.21a.3.3 0 01.3-.3h9.795V.3a.3.3 0 01.3-.3h3.21a.3.3 0 01.3.3v9.795H23.7a.3.3 0 01.3.3v3.21z"
                            fill="#212134"
                          />
                        </svg>
                      </div>
                      <div
                        class="c49"
                      >
                        <span
                          class="c50"
                        >
                          Create new webhook
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    `);
  });

  describe('Shows a loading state', () => {
    it('should show a loader when it is loading for the permissions', () => {
      useRBAC.mockImplementation(() => ({
        isLoading: true,
        allowedActions: { canUpdate: true, canCreate: true, canRead: true, canDelete: true },
      }));

      render(App);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should show a loader when it is loading for the data and not for the permissions', () => {
      useRBAC.mockImplementation(() => ({
        isLoading: false,
        allowedActions: { canUpdate: true, canCreate: true, canRead: true, canDelete: true },
      }));

      render(App);

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });
  });

  it('should show a list of webhooks', async () => {
    useRBAC.mockImplementation(() => ({
      isLoading: false,
      allowedActions: { canUpdate: true, canCreate: true, canRead: true, canDelete: true },
    }));

    render(App);

    await waitFor(() => {
      expect(screen.getByText('http:://strapi.io')).toBeInTheDocument();
    });
  });

  it('should show confirmation delete modal', async () => {
    useRBAC.mockImplementation(() => ({
      isLoading: false,
      allowedActions: { canUpdate: true, canCreate: true, canRead: true, canDelete: true },
    }));

    const { container, getByText } = render(App);
    await waitFor(() => {
      screen.getByText('http:://strapi.io');
    });

    fireEvent.click(container.querySelector('#delete-1'));

    expect(getByText('Are you sure you want to delete this?')).toBeInTheDocument();
  });
});
