import * as React from 'react';

import { Box, Flex, Typography, InputWrapper, Divider } from '@strapi/design-system';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { createEditor } from 'slate';
import { withHistory } from 'slate-history';
import { Slate, withReact, ReactEditor } from 'slate-react';
import styled from 'styled-components';

import BlocksInput from './BlocksInput';
import { BlocksToolbar } from './Toolbar';

const TypographyAsterisk = styled(Typography)`
  line-height: 0;
`;

const LabelAction = styled(Box)`
  svg path {
    fill: ${({ theme }) => theme.colors.neutral500};
  }
`;

const EditorDivider = styled(Divider)`
  background: ${({ theme }) => theme.colors.neutral200};
`;

const Wrapper = styled(Box)`
  width: 100%;
  max-height: 512px;
  overflow: auto;
  padding: ${({ theme }) => `${theme.spaces[3]} ${theme.spaces[4]}`};
  font-size: ${({ theme }) => theme.fontSizes[2]};
  background-color: ${({ theme }) => theme.colors.neutral0};
  color: ${({ theme }) => theme.colors.neutral800};
  line-height: ${({ theme }) => theme.lineHeights[6]};
  border-radius: ${({ theme }) => theme.borderRadius};
`;

/**
 * Images are void elements. They handle the rendering of their children instead of Slate.
 * See the Slate documentation for more information:
 * - https://docs.slatejs.org/api/nodes/element#void-vs-not-void
 * - https://docs.slatejs.org/api/nodes/element#rendering-void-elements
 *
 * @param {import('slate').Editor} editor
 */
const withImages = (editor) => {
  const { isVoid } = editor;

  editor.isVoid = (element) => {
    return element.type === 'image' ? true : isVoid(element);
  };

  return editor;
};

const BlocksEditor = React.forwardRef(
  ({ intlLabel, labelAction, name, disabled, required, error, value, onChange }, ref) => {
    const { formatMessage } = useIntl();
    const [editor] = React.useState(() => withReact(withImages(withHistory(createEditor()))));

    const label = intlLabel.id
      ? formatMessage(
          { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
          { ...intlLabel.values }
        )
      : name;

    /** Editable is not able to hold the ref, https://github.com/ianstormtaylor/slate/issues/4082
     *  so with "useImperativeHandle" we can use ReactEditor methods to expose to the parent above
     *  also not passing forwarded ref here, gives console warning.
     */
    React.useImperativeHandle(
      ref,
      () => ({
        focus() {
          ReactEditor.focus(editor);
        },
      }),
      [editor]
    );

    const handleSlateChange = (state) => {
      const isAstChange = editor.operations.some((op) => op.type !== 'set_selection');

      if (isAstChange) {
        onChange({
          target: { name, value: state, type: 'blocks' },
        });
      }
    };

    return (
      <>
        <Flex direction="column" alignItems="stretch" gap={1}>
          <Flex gap={1}>
            <Typography variant="pi" fontWeight="bold" textColor="neutral800">
              {label}
              {required && <TypographyAsterisk textColor="danger600">*</TypographyAsterisk>}
            </Typography>
            {labelAction && <LabelAction paddingLeft={1}>{labelAction}</LabelAction>}
          </Flex>
          <Slate
            editor={editor}
            initialValue={value || [{ type: 'paragraph', children: [{ type: 'text', text: '' }] }]}
            onChange={handleSlateChange}
          >
            <InputWrapper direction="column" alignItems="flex-start">
              <BlocksToolbar disabled={disabled} />
              <EditorDivider width="100%" />
              <Wrapper>
                <BlocksInput disabled={disabled} />
              </Wrapper>
            </InputWrapper>
          </Slate>
        </Flex>
        {error && (
          <Box paddingTop={1}>
            <Typography variant="pi" textColor="danger600" data-strapi-field-error>
              {error}
            </Typography>
          </Box>
        )}
      </>
    );
  }
);

BlocksEditor.defaultProps = {
  labelAction: null,
  disabled: false,
  required: false,
  error: '',
  value: null,
};

BlocksEditor.propTypes = {
  intlLabel: PropTypes.shape({
    id: PropTypes.string.isRequired,
    defaultMessage: PropTypes.string.isRequired,
    values: PropTypes.object,
  }).isRequired,
  labelAction: PropTypes.element,
  name: PropTypes.string.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.array,
};

export default BlocksEditor;
