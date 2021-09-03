import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@strapi/parts/ThemeProvider';
import { lightTheme } from '@strapi/parts/themes';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import * as yup from 'yup';
import { IntlProvider } from 'react-intl';
import Register from '..';

jest.mock('../../../../../components/LocalesProvider/useLocalesProvider', () => () => ({
  changeLocale: () => {},
  localeNames: ['en'],
  messages: ['test'],
}));
jest.mock('@strapi/helper-plugin', () => ({
  ...jest.requireActual('@strapi/helper-plugin'),
  useNotification: () => jest.fn({}),
}));

describe('ADMIN | PAGES | AUTH | Register', () => {
  it('should render and match the snapshot', () => {
    const history = createMemoryHistory();
    const { container } = render(
      <IntlProvider locale="en" messages={{ en: {} }} textComponent="span">
        <ThemeProvider theme={lightTheme}>
          <Router history={history}>
            <Register fieldsToDisable={[]} noSignin onSubmit={() => {}} schema={yup.object()} />
          </Router>
        </ThemeProvider>
      </IntlProvider>
    );

    expect(container.firstChild).toMatchInlineSnapshot(`
      .c14 {
        font-weight: 600;
        font-size: 2rem;
        line-height: 1.25;
        color: #32324d;
      }

      .c4 {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #32324d;
      }

      .c17 {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #666687;
      }

      .c24 {
        font-weight: 500;
        font-size: 0.75rem;
        line-height: 1.33;
        color: #32324d;
      }

      .c32 {
        font-weight: 400;
        font-size: 0.75rem;
        line-height: 1.33;
        color: #666687;
      }

      .c18 {
        font-size: 1rem;
        line-height: 1.5;
      }

      .c5 {
        font-weight: 600;
        line-height: 1.14;
      }

      .c1 {
        padding-top: 24px;
        padding-right: 40px;
      }

      .c3 {
        padding-right: 4px;
      }

      .c6 {
        padding-top: 64px;
        padding-bottom: 64px;
      }

      .c7 {
        background: #ffffff;
        padding-top: 48px;
        padding-right: 56px;
        padding-bottom: 48px;
        padding-left: 56px;
        border-radius: 4px;
        box-shadow: 0px 1px 4px rgba(33,33,52,0.1);
      }

      .c13 {
        padding-top: 24px;
        padding-bottom: 4px;
      }

      .c15 {
        padding-bottom: 32px;
      }

      .c29 {
        padding-right: 12px;
        padding-left: 8px;
      }

      .c35 {
        padding-left: 8px;
      }

      .c0 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: row;
        -ms-flex-direction: row;
        flex-direction: row;
        -webkit-box-pack: end;
        -webkit-justify-content: flex-end;
        -ms-flex-pack: end;
        justify-content: flex-end;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c10 {
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

      .c25 {
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

      .c34 {
        margin: 0;
        height: 18px;
        min-width: 18px;
        border-radius: 4px;
        border: 1px solid #c0c0cf;
        -webkit-appearance: none;
        background-color: #ffffff;
      }

      .c34:checked {
        background-color: #4945ff;
        border: 1px solid #4945ff;
      }

      .c34:checked:after {
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

      .c34:checked:disabled:after {
        background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEwIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHBhdGgKICAgIGQ9Ik04LjU1MzIzIDAuMzk2OTczQzguNjMxMzUgMC4zMTYzNTUgOC43NjA1MSAwLjMxNTgxMSA4LjgzOTMxIDAuMzk1NzY4TDkuODYyNTYgMS40MzQwN0M5LjkzODkzIDEuNTExNTcgOS45MzkzNSAxLjYzNTkgOS44NjM0OSAxLjcxMzlMNC4wNjQwMSA3LjY3NzI0QzMuOTg1OSA3Ljc1NzU1IDMuODU3MDcgNy43NTgwNSAzLjc3ODM0IDcuNjc4MzRMMC4xMzg2NiAzLjk5MzMzQzAuMDYxNzc5OCAzLjkxNTQ5IDAuMDYxNzEwMiAzLjc5MDMyIDAuMTM4NTA0IDMuNzEyNEwxLjE2MjEzIDIuNjczNzJDMS4yNDAzOCAyLjU5NDMyIDEuMzY4NDMgMi41OTQyMiAxLjQ0NjggMi42NzM0OEwzLjkyMTc0IDUuMTc2NDdMOC41NTMyMyAwLjM5Njk3M1oiCiAgICBmaWxsPSIjOEU4RUE5IgogIC8+Cjwvc3ZnPg==) no-repeat no-repeat center center;
      }

      .c34:disabled {
        background-color: #dcdce4;
        border: 1px solid #c0c0cf;
      }

      .c34:indeterminate {
        background-color: #4945ff;
        border: 1px solid #4945ff;
      }

      .c34:indeterminate:after {
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

      .c34:indeterminate:disabled {
        background-color: #dcdce4;
        border: 1px solid #c0c0cf;
      }

      .c34:indeterminate:disabled:after {
        background-color: #8e8ea9;
      }

      .c19 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c19 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c19 > * + * {
        margin-top: 32px;
      }

      .c23 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c23 > * {
        margin-top: 0;
        margin-bottom: 0;
      }

      .c23 > * + * {
        margin-top: 4px;
      }

      .c27 {
        border: none;
        padding-left: 16px;
        padding-right: 16px;
        color: #32324d;
        font-weight: 400;
        font-size: 0.875rem;
        display: block;
        width: 100%;
        height: 2.5rem;
      }

      .c27::-webkit-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c27::-moz-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c27:-ms-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c27::placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c27:disabled {
        background: inherit;
        color: inherit;
      }

      .c27:focus {
        outline: none;
      }

      .c28 {
        border: none;
        padding-left: 16px;
        padding-right: 0;
        color: #32324d;
        font-weight: 400;
        font-size: 0.875rem;
        display: block;
        width: 100%;
        height: 2.5rem;
      }

      .c28::-webkit-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c28::-moz-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c28:-ms-input-placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c28::placeholder {
        color: #8e8ea9;
        opacity: 1;
      }

      .c28:disabled {
        background: inherit;
        color: inherit;
      }

      .c28:focus {
        outline: none;
      }

      .c26 {
        border: 1px solid #dcdce4;
        border-radius: 4px;
        background: #ffffff;
        overflow: hidden;
      }

      .c26:focus-within {
        border: 1px solid #4945ff;
      }

      .c33 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c33 * {
        cursor: default;
      }

      .c22 textarea {
        height: 5rem;
      }

      .c2 {
        border: none;
        background: transparent;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
        font-size: 0.75rem;
      }

      .c2 svg {
        height: 0.25rem;
      }

      .c2 svg path {
        fill: #8e8ea9;
      }

      .c20 {
        display: grid;
        grid-template-columns: repeat(12,1fr);
        gap: 16px;
      }

      .c21 {
        grid-column: span 6;
        word-break: break-all;
      }

      .c9 {
        outline: none;
      }

      .c41 {
        font-weight: 400;
        font-size: 0.875rem;
        line-height: 1.43;
        color: #32324d;
      }

      .c42 {
        font-weight: 600;
        line-height: 1.14;
      }

      .c37 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        cursor: pointer;
        padding: 8px;
        border-radius: 4px;
        background: #ffffff;
        border: 1px solid #dcdce4;
      }

      .c37 svg {
        height: 12px;
        width: 12px;
      }

      .c37 svg > g,
      .c37 svg path {
        fill: #ffffff;
      }

      .c37[aria-disabled='true'] {
        pointer-events: none;
      }

      .c38 {
        padding: 10px 16px;
        background: #4945ff;
        border: none;
        border: 1px solid #4945ff;
        background: #4945ff;
      }

      .c38 .c40 {
        color: #ffffff;
      }

      .c38[aria-disabled='true'] {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c38[aria-disabled='true'] .c40 {
        color: #666687;
      }

      .c38[aria-disabled='true'] svg > g,
      .c38[aria-disabled='true'] svg path {
        fill: #666687;
      }

      .c38[aria-disabled='true']:active {
        border: 1px solid #dcdce4;
        background: #eaeaef;
      }

      .c38[aria-disabled='true']:active .c40 {
        color: #666687;
      }

      .c38[aria-disabled='true']:active svg > g,
      .c38[aria-disabled='true']:active svg path {
        fill: #666687;
      }

      .c38:hover {
        border: 1px solid #7b79ff;
        background: #7b79ff;
      }

      .c38:active {
        border: 1px solid #4945ff;
        background: #4945ff;
      }

      .c8 {
        margin: 0 auto;
        width: 552px;
      }

      .c11 {
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
      }

      .c12 {
        height: 4.5rem;
      }

      .c39 {
        display: inline-block;
        width: 100%;
      }

      .c30 {
        border: none;
        background: transparent;
        font-size: 1.6rem;
        width: auto;
        padding: 0;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-align-items: center;
        -webkit-box-align: center;
        -ms-flex-align: center;
        align-items: center;
      }

      .c31 svg {
        height: 1rem;
        width: 1rem;
      }

      .c31 svg path {
        fill: #666687;
      }

      .c16 {
        text-align: center;
      }

      .c36 {
        color: #4945ff;
      }

      @media (max-width:68.75rem) {
        .c21 {
          grid-column: span;
        }
      }

      @media (max-width:34.375rem) {
        .c21 {
          grid-column: span;
        }
      }

      <div>
        <header
          class="c0"
        >
          <div
            class="c1"
          >
            <div>
              <button
                aria-controls="simplemenu-1"
                aria-expanded="false"
                aria-haspopup="true"
                class="c2"
                type="button"
              >
                <div
                  class="c3"
                >
                  <span
                    class="c4 c5"
                  />
                </div>
                <svg
                  aria-hidden="true"
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
        </header>
        <div
          class="c6"
        >
          <div
            class="c7 c8"
          >
            <form
              action="#"
              novalidate=""
            >
              <main
                aria-labelledby="welcome"
                class="c9"
                id="main-content"
                tabindex="-1"
              >
                <div
                  class="c10 c11"
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    class="c12"
                  />
                  <div
                    class="c13"
                  >
                    <h1
                      class="c14"
                      id="welcome"
                    >
                      Welcome back!
                    </h1>
                  </div>
                  <div
                    class="c15 c16"
                  >
                    <span
                      class="c17 c18"
                    >
                      Your credentials are only used to authenticate yourself on the admin panel. All saved data will be stored in your own database.
                    </span>
                  </div>
                </div>
                <div
                  class="c19"
                >
                  <div
                    class="c20"
                  >
                    <div
                      class="c21"
                    >
                      <div
                        class=""
                      >
                        <div
                          class="c22"
                        >
                          <div>
                            <div
                              class="c23"
                            >
                              <div
                                class="c10"
                              >
                                <label
                                  class="c24"
                                  for="textinput-2"
                                >
                                  Firstname
                                </label>
                              </div>
                              <div
                                class="c25 c26"
                              >
                                <input
                                  aria-invalid="false"
                                  class="c27"
                                  id="textinput-2"
                                  name="firstname"
                                  required=""
                                  value=""
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      class="c21"
                    >
                      <div
                        class=""
                      >
                        <div
                          class="c22"
                        >
                          <div>
                            <div
                              class="c23"
                            >
                              <div
                                class="c10"
                              >
                                <label
                                  class="c24"
                                  for="textinput-3"
                                >
                                  Lastname
                                </label>
                              </div>
                              <div
                                class="c25 c26"
                              >
                                <input
                                  aria-invalid="false"
                                  class="c27"
                                  id="textinput-3"
                                  name="lastname"
                                  required=""
                                  value=""
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c22"
                  >
                    <div>
                      <div
                        class="c23"
                      >
                        <div
                          class="c10"
                        >
                          <label
                            class="c24"
                            for="textinput-4"
                          >
                            Email
                          </label>
                        </div>
                        <div
                          class="c25 c26"
                        >
                          <input
                            aria-invalid="false"
                            class="c27"
                            id="textinput-4"
                            name="email"
                            required=""
                            type="email"
                            value=""
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c22"
                  >
                    <div>
                      <div
                        class="c23"
                      >
                        <div
                          class="c10"
                        >
                          <label
                            class="c24"
                            for="textinput-5"
                          >
                            Password
                          </label>
                        </div>
                        <div
                          class="c25 c26"
                        >
                          <input
                            aria-describedby="textinput-5-hint"
                            aria-invalid="false"
                            class="c28"
                            id="textinput-5"
                            name="password"
                            required=""
                            type="password"
                            value=""
                          />
                          <div
                            class="c29"
                          >
                            <button
                              aria-label="Hide password"
                              class="c30 c31"
                              type="button"
                            >
                              <svg
                                fill="none"
                                height="1em"
                                viewBox="0 0 24 24"
                                width="1em"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M4.048 6.875L2.103 4.93a1 1 0 111.414-1.415l16.966 16.966a1 1 0 11-1.414 1.415l-2.686-2.686a12.247 12.247 0 01-4.383.788c-3.573 0-6.559-1.425-8.962-3.783a15.842 15.842 0 01-2.116-2.568 11.096 11.096 0 01-.711-1.211 1.145 1.145 0 010-.875c.124-.258.36-.68.711-1.211.58-.876 1.283-1.75 2.116-2.569.326-.32.663-.622 1.01-.906zm10.539 10.539l-1.551-1.551a4.005 4.005 0 01-4.9-4.9L6.584 9.411a6 6 0 008.002 8.002zM7.617 4.787A12.248 12.248 0 0112 3.998c3.572 0 6.559 1.426 8.961 3.783a15.845 15.845 0 012.117 2.569c.351.532.587.954.711 1.211.116.242.115.636 0 .875-.124.257-.36.68-.711 1.211-.58.876-1.283 1.75-2.117 2.568-.325.32-.662.623-1.01.907l-2.536-2.537a6 6 0 00-8.002-8.002L7.617 4.787zm3.347 3.347A4.005 4.005 0 0116 11.998c0 .359-.047.706-.136 1.037l-4.9-4.901z"
                                  fill="#212134"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p
                          class="c32"
                          id="textinput-5-hint"
                        >
                          Password must contain at least 8 characters, 1 uppercase, 1 lowercase and 1 number
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    class="c22"
                  >
                    <div>
                      <div
                        class="c23"
                      >
                        <div
                          class="c10"
                        >
                          <label
                            class="c24"
                            for="textinput-6"
                          >
                            Confirmation Password
                          </label>
                        </div>
                        <div
                          class="c25 c26"
                        >
                          <input
                            aria-invalid="false"
                            class="c28"
                            id="textinput-6"
                            name="confirmPassword"
                            required=""
                            type="password"
                            value=""
                          />
                          <div
                            class="c29"
                          >
                            <button
                              aria-label="Hide password"
                              class="c30 c31"
                              type="button"
                            >
                              <svg
                                fill="none"
                                height="1em"
                                viewBox="0 0 24 24"
                                width="1em"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M4.048 6.875L2.103 4.93a1 1 0 111.414-1.415l16.966 16.966a1 1 0 11-1.414 1.415l-2.686-2.686a12.247 12.247 0 01-4.383.788c-3.573 0-6.559-1.425-8.962-3.783a15.842 15.842 0 01-2.116-2.568 11.096 11.096 0 01-.711-1.211 1.145 1.145 0 010-.875c.124-.258.36-.68.711-1.211.58-.876 1.283-1.75 2.116-2.569.326-.32.663-.622 1.01-.906zm10.539 10.539l-1.551-1.551a4.005 4.005 0 01-4.9-4.9L6.584 9.411a6 6 0 008.002 8.002zM7.617 4.787A12.248 12.248 0 0112 3.998c3.572 0 6.559 1.426 8.961 3.783a15.845 15.845 0 012.117 2.569c.351.532.587.954.711 1.211.116.242.115.636 0 .875-.124.257-.36.68-.711 1.211-.58.876-1.283 1.75-2.117 2.568-.325.32-.662.623-1.01.907l-2.536-2.537a6 6 0 00-8.002-8.002L7.617 4.787zm3.347 3.347A4.005 4.005 0 0116 11.998c0 .359-.047.706-.136 1.037l-4.9-4.901z"
                                  fill="#212134"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div
                      class="c23"
                    >
                      <label
                        class="c4 c33"
                      >
                        <input
                          aria-label="news"
                          class="c34"
                          id="checkbox-7"
                          name="news"
                          type="checkbox"
                        />
                        <div
                          class="c35"
                        >
                          Keep me updated about the new features and upcoming improvements (by doing this you accept the 
                          <a
                            class="c36"
                            href="https://strapi.io/terms"
                            rel="noreferrer"
                            target="_blank"
                          >
                            terms
                          </a>
                           and the 
                          <a
                            class="c36"
                            href="https://strapi.io/privacy"
                            rel="noreferrer"
                            target="_blank"
                          >
                            policy
                          </a>
                          ).
                        </div>
                      </label>
                    </div>
                  </div>
                  <button
                    aria-disabled="false"
                    class="c37 c38 c39"
                    type="submit"
                  >
                    <span
                      class="c40 c41 c42"
                    >
                      Let's start
                    </span>
                  </button>
                </div>
              </main>
            </form>
          </div>
        </div>
      </div>
    `);
  });
});
