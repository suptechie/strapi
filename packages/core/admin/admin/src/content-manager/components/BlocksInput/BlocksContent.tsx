import * as React from 'react';

import { Box, Flex, IconButton } from '@strapi/design-system';
import { Drag } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { Editor, Range, Transforms, Element } from 'slate';
import { ReactEditor, type RenderElementProps, type RenderLeafProps, Editable } from 'slate-react';
import styled, { CSSProperties, css } from 'styled-components';

import { useDragAndDrop, DIRECTIONS } from '../../hooks/useDragAndDrop';
import { ItemTypes } from '../../utils/dragAndDrop';
import { composeRefs } from '../../utils/refs';
import { getTranslation } from '../../utils/translations';

import { type BlocksStore, useBlocksEditorContext } from './BlocksEditor';
import { useConversionModal } from './BlocksToolbar';
import { type ModifiersStore } from './Modifiers';
import { getAttributesToClear } from './utils/conversions';
import { getEntries, isLinkNode, isListNode } from './utils/types';

const StyledEditable = styled(Editable)`
  // The outline style is set on the wrapper with :focus-within
  outline: none;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spaces[3]};
  height: 100%;

  > *:last-child {
    padding-bottom: ${({ theme }) => theme.spaces[3]};
  }
`;

const Wrapper = styled(Box)<{ isOverDropTarget: boolean }>`
  position: ${({ isOverDropTarget }) => isOverDropTarget && 'relative'};
`;

type DragDirection = (typeof DIRECTIONS)[keyof typeof DIRECTIONS];

const DropPlaceholder = styled(Box)<{
  dragDirection: DragDirection | null;
  placeholderMargin: 1 | 2;
}>`
  position: absolute;
  right: 0;

  // Show drop placeholder 8px above or below the drop target
  ${({ dragDirection, theme, placeholderMargin }) => css`
    top: ${dragDirection === DIRECTIONS.UPWARD && `-${theme.spaces[placeholderMargin]}`};
    bottom: ${dragDirection === DIRECTIONS.DOWNWARD && `-${theme.spaces[placeholderMargin]}`};
  `}
`;

const DragItem = styled(Flex)<{ dragVisibility: CSSProperties['visibility'] }>`
  // Style each block rendered using renderElement()
  & > [data-slate-node='element'] {
    width: 100%;
    opacity: inherit;
  }

  // Set the visibility of drag button
  [role='button'] {
    visibility: ${(props) => props.dragVisibility};
    opacity: inherit;
  }
  &[aria-disabled='true'] {
    user-drag: none;
  }
`;

const DragIconButton = styled(IconButton)<{ dragHandleTopMargin?: CSSProperties['marginTop'] }>`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius};
  width: ${({ theme }) => theme.spaces[4]};
  height: ${({ theme }) => theme.spaces[6]};
  visibility: hidden;
  cursor: grab;
  opacity: inherit;
  margin-top: ${(props) => props.dragHandleTopMargin ?? 0};

  &:hover {
    background: ${({ theme }) => theme.colors.neutral200};
  }
  &:active {
    cursor: grabbing;
  }
  &[aria-disabled='true'] {
    cursor: not-allowed;
    background: transparent;
  }
  svg {
    height: auto;
    width: ${({ theme }) => theme.spaces[3]};

    path {
      fill: ${({ theme }) => theme.colors.neutral700};
    }
  }
`;

type Direction = {
  setDragDirection: (direction: DragDirection) => void;
  dragDirection: DragDirection | null;
};

type DragAndDropElementProps = Direction & {
  children: RenderElementProps['children'];
  index: Array<number>;
  dragHandleTopMargin?: CSSProperties['marginTop'];
};

const DragAndDropElement = ({
  children,
  index,
  setDragDirection,
  dragDirection,
  dragHandleTopMargin,
}: DragAndDropElementProps) => {
  const { editor, disabled, name, setLiveText } = useBlocksEditorContext('drag-and-drop');
  const { formatMessage } = useIntl();
  const [dragVisibility, setDragVisibility] = React.useState<CSSProperties['visibility']>('hidden');

  const handleMoveBlock = React.useCallback(
    (newIndex: Array<number>, currentIndex: Array<number>) => {
      const [newNode] = Editor.node(editor, newIndex);
      const [draggedNode] = Editor.node(editor, currentIndex);

      Transforms.moveNodes(editor, {
        at: currentIndex,
        to: newIndex,
      });

      // Add 1 to the index for the live text message
      const currentIndexPosition = [currentIndex[0] + 1, ...currentIndex.slice(1)];
      const newIndexPosition = [newIndex[0] + 1, ...newIndex.slice(1)];

      setLiveText(
        formatMessage(
          {
            id: getTranslation('components.Blocks.dnd.reorder'),
            defaultMessage: '{item}, moved. New position in the editor: {position}.',
          },
          {
            item: `${name}.${currentIndexPosition.join(',')}`,
            position: `${newIndexPosition.join(',')} of ${editor.children.length}`,
          }
        )
      );

      if (Element.isElement(newNode) && Element.isElement(draggedNode)) {
        // If a node is dragged into the list block then convert it to a list-item
        if (newNode.type === 'list-item' && draggedNode.type !== 'list-item') {
          Transforms.setNodes(
            editor,
            { ...getAttributesToClear(draggedNode), type: 'list-item' },
            {
              at:
                newIndex[0] > currentIndex[0] ? [newIndex[0] - 1, ...newIndex.slice(1)] : newIndex,
            }
          );

          // When a node is dragged downward into the list, the items shift upward by one index
          if (newIndex[0] > currentIndex[0]) {
            Transforms.moveNodes(editor, {
              at: [newIndex[0] - 1, ...newIndex.slice(1)],
              to: [newIndex[0] - 1, newIndex[1] + 1, ...newIndex.slice(2)],
            });
          }
        }

        // If a node is dragged out of the list block then convert it to a paragraph
        if (newNode.type !== 'list-item' && draggedNode.type === 'list-item') {
          Transforms.setNodes(editor, { type: 'paragraph' }, { at: newIndex });

          if (newIndex[0] < currentIndex[0]) {
            // Node is dragged upwards out of list block
            currentIndex[0] += 1;
          }

          // Node is dragged downwards out of list block, as items are not shifting by 1 we move the item below the dragged index
          if (newIndex[0] > currentIndex[0]) {
            Transforms.moveNodes(editor, {
              at: newIndex,
              to: [newIndex[0] + 1],
            });
          }
        }

        // If a list item is dragged into the another list block
        if (newNode.type === 'list-item' && draggedNode.type === 'list-item') {
          // Node is dragged downwards out of list block, as items are not shifting by 1 we move the item below the dragged index
          if (newIndex[0] > currentIndex[0]) {
            Transforms.moveNodes(editor, {
              at: newIndex,
              to: [newIndex[0], newIndex[1] + 1, ...newIndex.slice(2)],
            });
          }
        }

        // If a dragged node is the only list-item then delete list block
        if (draggedNode.type === 'list-item') {
          const [listNode, listNodePath] = Editor.parent(editor, currentIndex);

          const isListEmpty =
            listNode.children?.length === 1 &&
            listNode.children?.[0].type === 'text' &&
            listNode.children?.[0].text === '';
          if (isListEmpty) {
            Transforms.removeNodes(editor, { at: listNodePath });
          }
        }
      }
    },
    [editor, formatMessage, name, setLiveText]
  );

  const [{ handlerId, isDragging, isOverDropTarget, direction }, blockRef, dropRef, dragRef] =
    useDragAndDrop(!disabled, {
      type: `${ItemTypes.BLOCKS}_${name}`,
      index,
      item: {
        index,
        displayedValue: children,
      },
      onDropItem(currentIndex, newIndex) {
        if (newIndex) handleMoveBlock(newIndex, currentIndex);
      },
    });

  const composedBoxRefs = composeRefs(blockRef, dropRef);

  // Set Drag direction before loosing state while dragging
  React.useEffect(() => {
    if (direction) {
      setDragDirection(direction);
    }
  }, [direction, setDragDirection]);

  // On selection change hide drag handle
  React.useEffect(() => {
    setDragVisibility('hidden');
  }, [editor.selection]);

  return (
    <Wrapper ref={(ref) => composedBoxRefs(ref!)} isOverDropTarget={isOverDropTarget}>
      {isOverDropTarget && (
        <DropPlaceholder
          borderStyle="solid"
          borderColor="secondary200"
          borderWidth="2px"
          width="calc(100% - 24px)"
          marginLeft="auto"
          dragDirection={dragDirection}
          // For list items placeholder reduce the margin around
          placeholderMargin={children.props.as && children.props.as === 'li' ? 1 : 2}
        />
      )}
      {isDragging ? (
        <CloneDragItem dragHandleTopMargin={dragHandleTopMargin}>{children}</CloneDragItem>
      ) : (
        <DragItem
          ref={dragRef}
          data-handler-id={handlerId}
          gap={2}
          paddingLeft={2}
          alignItems="start"
          onDragStart={(event) => {
            const target = event.target as HTMLElement;
            const currentTarget = event.currentTarget as HTMLElement;

            // Dragging action should only trigger drag event when button is dragged, however update styles on the whole dragItem.
            if (target.getAttribute('role') !== 'button') {
              event.preventDefault();
            } else {
              // Setting styles using dragging state is not working, so set it on current target element as nodes get dragged
              currentTarget.style.opacity = '0.5';
            }
          }}
          onDragEnd={(event) => {
            const currentTarget = event.currentTarget as HTMLElement;
            currentTarget.style.opacity = '1';
          }}
          onMouseMove={() => setDragVisibility('visible')}
          onSelect={() => setDragVisibility('visible')}
          onMouseLeave={() => setDragVisibility('hidden')}
          aria-disabled={disabled}
          dragVisibility={dragVisibility}
        >
          <DragIconButton
            forwardedAs="div"
            role="button"
            tabIndex={0}
            aria-label={formatMessage({
              id: getTranslation('components.DragHandle-label'),
              defaultMessage: 'Drag',
            })}
            onClick={(e) => e.stopPropagation()}
            aria-disabled={disabled}
            disabled={disabled}
            draggable
            // For some blocks top margin added to drag handle to align at the text level
            dragHandleTopMargin={dragHandleTopMargin}
          >
            <Drag color="neutral600" />
          </DragIconButton>
          {children}
        </DragItem>
      )}
    </Wrapper>
  );
};

interface CloneDragItemProps {
  children: RenderElementProps['children'];
  dragHandleTopMargin?: CSSProperties['marginTop'];
}

// To prevent applying opacity to the original item being dragged, display a cloned element without opacity.
const CloneDragItem = ({ children, dragHandleTopMargin }: CloneDragItemProps) => {
  const { formatMessage } = useIntl();

  return (
    <DragItem gap={2} paddingLeft={2} alignItems="start" dragVisibility="visible">
      <DragIconButton
        forwardedAs="div"
        role="button"
        aria-label={formatMessage({
          id: getTranslation('components.DragHandle-label'),
          defaultMessage: 'Drag',
        })}
        dragHandleTopMargin={dragHandleTopMargin}
      >
        <Drag color="neutral600" />
      </DragIconButton>
      {children}
    </DragItem>
  );
};

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

type BaseRenderElementProps = Direction & {
  props: RenderElementProps['children'];
  blocks: BlocksStore;
  editor: Editor;
};

const baseRenderElement = ({
  props,
  blocks,
  editor,
  setDragDirection,
  dragDirection,
}: BaseRenderElementProps) => {
  const blockMatch = Object.values(blocks).find((block) => block.matchNode(props.element));
  const block = blockMatch || blocks.paragraph;
  const nodePath = ReactEditor.findPath(editor, props.element);

  // Link is inline block so it cannot be dragged
  // List is skipped from dragged items
  if (isLinkNode(props.element) || isListNode(props.element)) return block.renderElement(props);

  return (
    <DragAndDropElement
      index={nodePath}
      setDragDirection={setDragDirection}
      dragDirection={dragDirection}
      dragHandleTopMargin={block.dragHandleTopMargin}
    >
      {block.renderElement(props)}
    </DragAndDropElement>
  );
};

interface BlocksInputProps {
  placeholder?: string;
}

const BlocksContent = ({ placeholder }: BlocksInputProps) => {
  const { editor, disabled, blocks, modifiers, setLiveText } =
    useBlocksEditorContext('BlocksContent');
  const blocksRef = React.useRef<HTMLDivElement>(null);
  const { formatMessage } = useIntl();
  const [dragDirection, setDragDirection] = React.useState<DragDirection | null>(null);
  const { modalElement, handleConversionResult } = useConversionModal();

  // Create renderLeaf function based on the modifiers store
  const renderLeaf = React.useCallback(
    (props: RenderLeafProps) => baseRenderLeaf(props, modifiers),
    [modifiers]
  );

  const handleMoveBlocks = (editor: Editor, event: React.KeyboardEvent<HTMLElement>) => {
    if (!editor.selection) return;

    const start = Range.start(editor.selection);
    const currentIndex = [start.path[0]];
    let newIndexPosition = 0;

    if (event.key === 'ArrowUp') {
      newIndexPosition = currentIndex[0] > 0 ? currentIndex[0] - 1 : currentIndex[0];
    } else {
      newIndexPosition =
        currentIndex[0] < editor.children.length - 1 ? currentIndex[0] + 1 : currentIndex[0];
    }

    const newIndex = [newIndexPosition];

    if (newIndexPosition !== currentIndex[0]) {
      Transforms.moveNodes(editor, {
        at: currentIndex,
        to: newIndex,
      });

      setLiveText(
        formatMessage(
          {
            id: getTranslation('components.Blocks.dnd.reorder'),
            defaultMessage: '{item}, moved. New position in the editor: {position}.',
          },
          {
            item: `${name}.${currentIndex[0] + 1}`,
            position: `${newIndex[0] + 1} of ${editor.children.length}`,
          }
        )
      );

      event.preventDefault();
    }
  };

  // Create renderElement function base on the blocks store
  const renderElement = React.useCallback(
    (props: RenderElementProps) =>
      baseRenderElement({ props, blocks, editor, dragDirection, setDragDirection }),
    [blocks, editor, dragDirection, setDragDirection]
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

    const selectedNode = editor.children[editor.selection.anchor.path[0]];
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

  const handleKeyboardShortcuts = (event: React.KeyboardEvent<HTMLElement>) => {
    const isCtrlOrCmd = event.metaKey || event.ctrlKey;

    if (isCtrlOrCmd) {
      // Check if there's a modifier to toggle
      Object.values(modifiers).forEach((value) => {
        if (value.isValidEventKey(event)) {
          value.handleToggle(editor);
          return;
        }
      });
      if (event.shiftKey && ['ArrowUp', 'ArrowDown'].includes(event.key)) {
        handleMoveBlocks(editor, event);
      }
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

    handleKeyboardShortcuts(event);

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
  const handleScrollSelectionIntoView = () => {
    if (!editor.selection) return;
    const domRange = ReactEditor.toDOMRange(editor, editor.selection);
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
      paddingRight={4}
      paddingTop={6}
      paddingBottom={3}
    >
      <StyledEditable
        readOnly={disabled}
        placeholder={placeholder}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onKeyDown={handleKeyDown}
        scrollSelectionIntoView={handleScrollSelectionIntoView}
        // As we have our own handler to drag and drop the elements returing true will skip slate's own event handler
        onDrop={() => {
          return true;
        }}
        onDragStart={() => {
          return true;
        }}
      />
      {modalElement}
    </Box>
  );
};

export { BlocksContent };
