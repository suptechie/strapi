import React from 'react';

import { DesignSystemProvider } from '@strapi/design-system';
import { render as renderTL } from '@testing-library/react';

import en from '../../../translations/en.json';
import { ImageAssetCard } from '../ImageAssetCard';

jest.mock('../../../utils', () => ({
  ...jest.requireActual('../../../utils'),
  getTrad: (x) => x,
}));

jest.mock('react-intl', () => ({
  useIntl: () => ({ formatMessage: jest.fn(({ id }) => en[id]) }),
}));

describe('ImageAssetCard', () => {
  it('snapshots the component', () => {
    const { container } = renderTL(
      <DesignSystemProvider>
        <ImageAssetCard
          alt=""
          name="hello.png"
          extension="png"
          height={40}
          width={40}
          thumbnail="http://somewhere.com/hello.png"
          selected={false}
          onSelect={jest.fn()}
          onEdit={jest.fn()}
          isUrlSigned={false}
        />
      </DesignSystemProvider>
    );

    expect(container).toMatchInlineSnapshot(`
      .c0 {
        background: #ffffff;
        border-radius: 4px;
        border-style: solid;
        border-width: 1px;
        border-color: #eaeaef;
        box-shadow: 0px 1px 4px rgba(33, 33, 52, 0.1);
        height: 100%;
      }

      .c2 {
        position: relative;
      }

      .c11 {
        border-radius: 4px;
        display: inline-flex;
        cursor: pointer;
      }

      .c17 {
        padding-block-start: 8px;
        padding-inline-end: 12px;
        padding-block-end: 8px;
        padding-inline-start: 12px;
      }

      .c20 {
        padding-block-start: 4px;
      }

      .c24 {
        padding-block-start: 4px;
        flex-grow: 1;
      }

      .c27 {
        background: #eaeaef;
        padding-inline-end: 8px;
        padding-inline-start: 8px;
        min-width: 20px;
      }

      .c3 {
        align-items: center;
        display: flex;
        flex-direction: row;
        justify-content: center;
      }

      .c5 {
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: 8px;
      }

      .c12 {
        align-items: center;
        display: inline-flex;
        flex-direction: row;
        justify-content: center;
      }

      .c18 {
        align-items: flex-start;
        display: flex;
        flex-direction: row;
      }

      .c25 {
        align-items: center;
        display: flex;
        flex-direction: row;
      }

      .c21 {
        font-size: 1.2rem;
        line-height: 1.33;
        font-weight: 600;
        color: #32324d;
      }

      .c22 {
        font-size: 1.2rem;
        line-height: 1.33;
        color: #666687;
      }

      .c30 {
        font-weight: 600;
        font-size: 1.1rem;
        line-height: 1.45;
        text-transform: uppercase;
        line-height: 1rem;
        color: #666687;
      }

      .c14 {
        border: 0;
        clip: rect(0 0 0 0);
        height: 1px;
        margin: -1px;
        overflow: hidden;
        padding: 0;
        position: absolute;
        width: 1px;
      }

      .c28 {
        border-radius: 4px;
        padding-block: 0.7rem;
      }

      .c6 {
        position: absolute;
        top: 12px;
        left: 12px;
      }

      .c8 {
        position: absolute;
        top: 12px;
        right: 12px;
      }

      .c16 {
        margin: 0;
        padding: 0;
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;
      }

      .c15 {
        display: flex;
        justify-content: center;
        height: 16.4rem;
        width: 100%;
        background: repeating-conic-gradient(#f6f6f9 0% 25%, transparent 0% 50%) 50%/20px 20px;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
      }

      .c26 {
        margin-left: auto;
        flex-shrink: 0;
      }

      .c29 {
        margin-left: 4px;
      }

      .c7 {
        background: #ffffff;
        width: 2rem;
        height: 2rem;
        border-radius: 4px;
        border: 1px solid #c0c0cf;
        position: relative;
        z-index: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 0 0 2rem;
      }

      .c7[data-state='checked'],
      .c7[data-state='indeterminate'] {
        border: 1px solid #4945ff;
        background-color: #4945ff;
      }

      .c7[data-disabled] {
        background-color: #dcdce4;
      }

      .c7::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        min-width: 44px;
        min-height: 44px;
      }

      .c19 {
        word-break: break-all;
      }

      .c4 {
        border-bottom: 1px solid #eaeaef;
      }

      .c13 {
        text-decoration: none;
        padding-block: 0.9rem;
        padding-inline: 0.9rem;
        border: 1px solid #dcdce4;
        background: #ffffff;
        color: #32324d;
        color: #666687;
      }

      .c13:hover {
        background-color: #f6f6f9;
      }

      .c13:active {
        background-color: #eaeaef;
      }

      .c13[aria-disabled='true'] {
        border: 1px solid #dcdce4;
        background: #eaeaef;
        color: #666687;
        cursor: default;
      }

      .c23 {
        text-transform: uppercase;
      }

      .c10 {
        opacity: 0;
      }

      .c10:focus-within {
        opacity: 1;
      }

      .c1 {
        cursor: pointer;
      }

      .c1:hover .c9 {
        opacity: 1;
      }

      @media (prefers-reduced-motion: no-preference) {
        .c7 {
          transition: border-color 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94),background-color 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      }

      @media (prefers-reduced-motion: no-preference) {
        .c13 {
          transition: background-color 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94),color 120ms cubic-bezier(0.25, 0.46, 0.45, 0.94),border-color 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      }

      <div>
        <article
          aria-labelledby=":r0:-title"
          class="c0 c1"
          role="button"
          tabindex="-1"
        >
          <div
            class="c2 c3 c4"
          >
            <div>
              <div
                class="c5 c6"
              >
                <button
                  aria-checked="false"
                  aria-labelledby=":r0:-title"
                  class="c7"
                  data-state="unchecked"
                  role="checkbox"
                  type="button"
                  value="on"
                />
              </div>
            </div>
            <div
              class="c5 c8 c9 c10"
            >
              <button
                aria-disabled="false"
                class="c11 c12 c13"
                data-state="closed"
              >
                <svg
                  aria-hidden="true"
                  fill="currentColor"
                  focusable="false"
                  height="16"
                  viewBox="0 0 32 32"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m28.414 9.171-5.585-5.586a2 2 0 0 0-2.829 0L4.586 19A1.98 1.98 0 0 0 4 20.414V26a2 2 0 0 0 2 2h5.586A1.98 1.98 0 0 0 13 27.414L28.414 12a2 2 0 0 0 0-2.829M24 13.585 18.414 8l3-3L27 10.585z"
                  />
                </svg>
                <span
                  class="c14"
                >
                  Edit
                </span>
              </button>
            </div>
            <div
              class="c15"
            >
              <img
                alt=""
                aria-hidden="true"
                class="c16"
                src="http://somewhere.com/hello.png"
              />
            </div>
          </div>
          <div
            class="c17"
          >
            <div
              class="c18"
            >
              <div
                class="c19"
              >
                <div
                  class="c20"
                >
                  <h2
                    class="c21"
                    id=":r0:-title"
                  >
                    hello.png
                  </h2>
                </div>
                <div
                  class="c22"
                >
                  <span
                    class="c23"
                  >
                    png
                  </span>
                   - 40✕40
                </div>
              </div>
              <div
                class="c24 c25"
              >
                <div
                  class="c26"
                >
                  <div
                    class="c27 c12 c28 c29"
                  >
                    <span
                      class="c30"
                    >
                      Image
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
        <span
          class="c14"
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
        </span>
      </div>
    `);
  });
});
