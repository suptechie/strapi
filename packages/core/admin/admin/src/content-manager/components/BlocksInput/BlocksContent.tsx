import * as React from 'react';

import { Box } from '@strapi/design-system';
import { Editor, Transforms } from 'slate';
import {
  type ReactEditor,
  type RenderElementProps,
  type RenderLeafProps,
  Editable,
} from 'slate-react';
import styled from 'styled-components';

import { type BlocksStore, useBlocksEditorContext } from './BlocksEditor';
import { useConversionModal } from './BlocksToolbar';
import { type ModifiersStore } from './Modifiers';
import { getEntries } from './utils/types';

const StyledEditable = styled(Editable)`
  // The outline style is set on the wrapper with :focus-within
  outline: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spaces[2]};
  height: 100%;

  > *:last-child {
    padding-bottom: ${({ theme }) => theme.spaces[3]};
  }
`;

const baseRenderLeaf = (props: RenderLeafProps, modifiers: ModifiersStore) => {
  // Recursively wrap the children for each active modifier
  const wrappedChildren = getEntries(modifiers).reduce((currentChildren, modifierEntry) => {
    const [name, modifier] = modifierEntry;

    if (props.leaf[name]) {
      return modifier.renderLeaf(currentChildren);
    }

    return currentChildren;
  }, props.children);

  return <span {...props.attributes}>{wrappedChildren}</span>;
};

const baseRenderElement = (props: RenderElementProps, blocks: BlocksStore) => {
  const blockMatch = Object.values(blocks).find((block) => block.matchNode(props.element));
  const block = blockMatch || blocks.paragraph;

  return block.renderElement(props);
};

interface BlocksInputProps {
  placeholder?: string;
}

const BlocksContent = ({ placeholder }: BlocksInputProps) => {
  const { editor, disabled, blocks, modifiers } = useBlocksEditorContext('BlocksContent');
  const blocksRef = React.useRef<HTMLDivElement>(null);
  const { modalElement, handleConversionResult } = useConversionModal();

  // Create renderLeaf function based on the modifiers store
  const renderLeaf = React.useCallback(
    (props: RenderLeafProps) => baseRenderLeaf(props, modifiers),
    [modifiers]
  );

  // Create renderElement function base on the blocks store
  const renderElement = React.useCallback(
    (props: RenderElementProps) => baseRenderElement(props, blocks),
    [blocks]
  );

  const checkSnippet = (event: React.KeyboardEvent<HTMLElement>) => {
    // Get current text block
    if (!editor.selection) {
      return;
    }

    const [textNode, textNodePath] = Editor.node(editor, editor.selection.anchor.path);

    // Narrow the type to a text node
    if (Editor.isEditor(textNode) || textNode.type !== 'text') {
      return;
    }

    // Don't check for snippets if we're not at the start of a block
    if (textNodePath.at(-1) !== 0) {
      return;
    }

    // Check if the text node starts with a known snippet
    const blockMatchingSnippet = Object.values(blocks).find((block) => {
      return block.snippets?.includes(textNode.text);
    });

    if (blockMatchingSnippet?.handleConvert) {
      // Prevent the space from being created and delete the snippet
      event.preventDefault();
      Transforms.delete(editor, {
        distance: textNode.text.length,
        unit: 'character',
        reverse: true,
      });

      // Convert the selected block
      const maybeRenderModal = blockMatchingSnippet.handleConvert(editor);
      handleConversionResult(maybeRenderModal);
    }
  };

  const handleEnter = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!editor.selection) {
      return;
    }

    // Get the selected node
    const selectedNode = editor.children[editor.selection.anchor.path[0]];

    // Find the matching block
    const selectedBlock = Object.values(blocks).find((block) => block.matchNode(selectedNode));
    if (!selectedBlock) {
      return;
    }

    // Allow forced line breaks when shift is pressed
    if (event.shiftKey && selectedNode.type !== 'image') {
      Transforms.insertText(editor, '\n');
      return;
    }

    // Check if there's an enter handler for the selected block
    if (selectedBlock.handleEnterKey) {
      selectedBlock.handleEnterKey(editor);
    } else {
      // If not, insert a new paragraph
      blocks.paragraph.handleEnterKey!(editor);
    }
  };

  const handleBackspaceEvent = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!editor.selection) {
      return;
    }

    const selectedNode = editor.children[editor.selection.anchor.path[0]];
    const selectedBlock = Object.values(blocks).find((block) => block.matchNode(selectedNode));

    if (!selectedBlock) {
      return;
    }

    if (selectedBlock.handleBackspaceKey) {
      selectedBlock.handleBackspaceKey(editor, event);
    }
  };

  /**
   * Modifier keyboard shortcuts
   */
  const handleModifierShortcuts = (event: React.KeyboardEvent<HTMLElement>) => {
    const isCtrlOrCmd = event.metaKey || event.ctrlKey;

    if (isCtrlOrCmd) {
      Object.values(modifiers).forEach((value) => {
        if (value.isValidEventKey(event)) {
          value.handleToggle(editor);
        }
      });
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLElement> = (event) => {
    // Find the right block-specific handlers for enter and backspace key presses
    if (event.key === 'Enter') {
      event.preventDefault();
      return handleEnter(event);
    }
    if (event.key === 'Backspace') {
      return handleBackspaceEvent(event);
    }

    // Check if there's a modifier to toggle
    handleModifierShortcuts(event);

    // Check if a snippet was triggered
    if (event.key === ' ') {
      checkSnippet(event);
    }
  };

  /**
   *  scrollSelectionIntoView : Slate's default method to scroll a DOM selection into the view,
   *  thats shifting layout for us when there is a overflowY:scroll on the viewport.
   *  We are overriding it to check if the selection is not fully within the visible area of the editor,
   *  we use scrollBy one line to the bottom
   */
  const handleScrollSelectionIntoView = (_: ReactEditor, domRange: Range) => {
    const domRect = domRange.getBoundingClientRect();
    const blocksInput = blocksRef.current;

    if (!blocksInput) {
      return;
    }

    const editorRect = blocksInput.getBoundingClientRect();

    // Check if the selection is not fully within the visible area of the editor
    if (domRect.top < editorRect.top || domRect.bottom > editorRect.bottom) {
      // Scroll by one line to the bottom
      blocksInput.scrollBy({
        top: 28, // 20px is the line-height + 8px line gap
        behavior: 'smooth',
      });
    }
  };

  return (
    <Box
      ref={blocksRef}
      grow={1}
      width="100%"
      overflow="auto"
      fontSize={2}
      background="neutral0"
      color="neutral800"
      lineHeight={6}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={3}
      paddingBottom={3}
    >
      <StyledEditable
        readOnly={disabled}
        placeholder={placeholder}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={handleKeyDown}
        scrollSelectionIntoView={handleScrollSelectionIntoView}
      />
      {modalElement}
    </Box>
  );
};

export { BlocksContent };
