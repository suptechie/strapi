/**
 *
 * Wysiwyg
 *
 */

import React from 'react';
import {
  ContentState,
  convertFromHTML,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  Modifier,
  RichUtils,
} from 'draft-js';
import PropTypes from 'prop-types';
import { cloneDeep, isEmpty, replace, trimStart, trimEnd } from 'lodash';
import cn from 'classnames';
import { FormattedMessage } from 'react-intl';
import Controls from 'components/WysiwygInlineControls';
import Select from 'components/InputSelect';
import WysiwygBottomControls from 'components/WysiwygBottomControls';
import WysiwygEditor from 'components/WysiwygEditor';
import {
  END_REPLACER,
  NEW_CONTROLS,
  SELECT_OPTIONS,
  START_REPLACER,
} from './constants';
import {
  getBlockStyle,
  getInnerText,
  getOffSets,
} from './helpers';

import styles from './styles.scss';

/* eslint-disable  react/no-string-refs */ // NOTE: need to check eslint
/* eslint-disable react/jsx-handler-names */
class Wysiwyg extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      editorState: EditorState.createEmpty(),
      isFocused: false,
      initialValue: '',
      headerValue: '',
      previewHTML: false,
      toggleFullScreen: false,
    };

    this.focus = () => {
      this.setState({ isFocused: true });
      return this.domEditor.focus();
    };
  }

  componentDidMount() {
    if (this.props.autoFocus) {
      this.focus();
    }

    if (!isEmpty(this.props.value)) {
      this.setInitialValue(this.props);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value && !this.state.hasInitialValue) {
      this.setInitialValue(nextProps);
    }

    // Handle reset props
    if (nextProps.value === this.state.initialValue && this.state.hasInitialValue) {
      this.setInitialValue(nextProps);
    }
  }

  addEntity = (text, style) => {
    const editorState = this.state.editorState;
    const currentContent = editorState.getCurrentContent();
    // Get the selected text
    const selection = editorState.getSelection();
    const anchorKey = selection.getAnchorKey();
    const currentContentBlock = currentContent.getBlockForKey(anchorKey);
    // Range of the text we want to replace
    const { start, end } = getOffSets(selection);
    // Retrieve the selected text
    const selectedText = currentContentBlock.getText().slice(start, end);
    const innerText = selectedText === '' ? getInnerText(style) : replace(text, 'innerText', selectedText);

    const trimedStart = trimStart(innerText, START_REPLACER).length;
    const trimedEnd = trimEnd(innerText, END_REPLACER).length;
    // Set the correct offset
    const focusOffset = start === end ? trimedEnd : start + trimedEnd;
    const anchorOffset = start + innerText.length - trimedStart;
    // Merge the old selection with the new one so the editorState is updated
    const updateSelection = selection.merge({
			anchorOffset,
			focusOffset,
		});

    // Dynamically add some content to the one selected
    const textWithEntity = Modifier.replaceText(currentContent, selection, innerText);

    // Push the new content to the editorState
    const newEditorState = EditorState.push(editorState, textWithEntity, 'insert-characters');

    // SetState and force focus
    this.setState({
      editorState: EditorState.forceSelection(newEditorState, updateSelection),
      headerValue: '',
    }, () => {
      this.focus();
    });
  }


  handleChangeSelect = ({ target }) => {
    this.setState({ headerValue: target.value });
    const splitData = target.value.split('.');
    this.addEntity(splitData[0], splitData[1]);
  }

  onChange = (editorState) => {
    this.setState({ editorState });
    this.props.onChange({ target: {
      value: editorState.getCurrentContent().getPlainText(),
      name: this.props.name,
      type: 'textarea',
    }});
  }

  mapKeyToEditorCommand = (e) => {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        this.state.editorState,
        4, /* maxDepth */
      );
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return;
    }

    return getDefaultKeyBinding(e);
  }

  // NOTE: leave these function if we change to HTML instead of markdown
  // toggleBlockType = (blockType) => {
  //   this.onChange(
  //     RichUtils.toggleBlockType(
  //       this.state.editorState,
  //       blockType
  //     )
  //   );
  // }
  //
  // toggleInlineStyle = (inlineStyle) => {
  //   this.onChange(
  //     RichUtils.toggleInlineStyle(
  //       this.state.editorState,
  //       inlineStyle
  //     )
  //   );
  // }

  toggleFullScreen = (e) => {
    e.preventDefault();
    this.setState({
      toggleFullScreen: !this.state.toggleFullScreen,
    }, () => {
      this.focus();
    });
  }

  /**
   * Init the editor with data from
   * @param {[type]} props [description]
   */
  setInitialValue = (props) => {
    const contentState = ContentState.createFromText(props.value);
    let editorState = EditorState.createWithContent(contentState);

    // Get the cursor at the end
    editorState = EditorState.moveFocusToEnd(editorState);

    this.setState({ editorState, hasInitialValue: true, initialValue: props.value });
  }

  handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  componentDidCatch(error, info) {
    console.log('err', error);
    console.log('info', info);
  }

  // NOTE: this need to be changed to preview markdown
  previewHTML = () => {
    const blocksFromHTML = convertFromHTML(this.props.value);

    // Make sure blocksFromHTML.contentBlocks !== null
    if (blocksFromHTML.contentBlocks) {
      const contentState = ContentState.createFromBlockArray(blocksFromHTML);
      return EditorState.createWithContent(contentState);
    }

    // Prevent errors if value is empty
    return EditorState.createEmpty();
  }

  render() {
    const { editorState } = this.state;

    if (this.state.toggleFullScreen) {
      // NOTE: this should be a function
      return (
        <div className={styles.fullscreenOverlay} onClick={this.toggleFullScreen}>
          <div
            className={cn(styles.editorWrapper, this.state.isFocused && styles.editorFocus)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{ marginTop: '0' }}
          >
            <div className={styles.controlsContainer}>
              <div style={{ minWidth: '161px', marginLeft: '8px' }}>
                <Select
                  name="headerSelect"
                  onChange={this.handleChangeSelect}
                  value={this.state.headerValue}
                  selectOptions={SELECT_OPTIONS}
                />
              </div>
              {NEW_CONTROLS.map((value, key) => (
                <Controls
                  key={key}
                  buttons={value}
                  editorState={editorState}
                  handlers={{
                    addEntity: this.addEntity,
                    // toggleBlockType: this.toggleBlockType,
                    // toggleInlineStyle: this.toggleInlineStyle,
                  }}
                  onToggle={this.toggleInlineStyle}
                  onToggleBlock={this.toggleBlockType}
                  previewHTML={() => this.setState(prevState => ({ previewHTML: !prevState.previewHTML }))}
                />
              ))}
            </div>
            <div className={styles.editor} onClick={this.focus}>
              <WysiwygEditor
                blockStyleFn={getBlockStyle}
                editorState={editorState}
                handleKeyCommand={this.handleKeyCommand}
                keyBindingFn={this.mapKeyToEditorCommand}
                onBlur={() => this.setState({ isFocused: false })}
                onChange={this.onChange}
                placeholder={this.props.placeholder}
                setRef={(editor) => this.domEditor = editor}
                spellCheck
              />
            </div>
          </div>
          <div
            className={cn(styles.editorWrapper)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{ marginTop: '0' }}
          >
            <div className={styles.previewControlsWrapper} onClick={this.toggleFullScreen}>
              <div><FormattedMessage id="components.WysiwygBottomControls.charactersIndicators" values={{ characters: 0 }} /></div>
              <div className={styles.wysiwygCollapse}>
                <FormattedMessage id="components.Wysiwyg.collapse" />
              </div>
            </div>
            <div className={styles.editor}>
              <WysiwygEditor
                // TODO handle markdown preview
                editorState={this.previewHTML()}
                onChange={() => {}}
                placeholder={this.props.placeholder}
                setRef={(dummyEditor) => this.dummyEditor = dummyEditor}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(styles.editorWrapper, this.state.isFocused && styles.editorFocus)}>
        <div className={styles.controlsContainer}>
          <div style={{ minWidth: '161px', marginLeft: '8px' }}>
            <Select
              name="headerSelect"
              onChange={this.handleChangeSelect}
              value={this.state.headerValue}
              selectOptions={SELECT_OPTIONS}
            />
          </div>
          {NEW_CONTROLS.map((value, key) => (
            <Controls
              key={key}
              buttons={value}
              editorState={editorState}
              handlers={{
                addEntity: this.addEntity,
                toggleBlockType: this.toggleBlockType,
                toggleInlineStyle: this.toggleInlineStyle,
              }}
              onToggle={this.toggleInlineStyle}
              onToggleBlock={this.toggleBlockType}
              previewHTML={() => this.setState(prevState => ({ previewHTML: !prevState.previewHTML }))}
            />
          ))}
        </div>
        <div className={styles.editor} onClick={this.focus}>
          <WysiwygEditor
            blockStyleFn={getBlockStyle}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            onBlur={() => this.setState({ isFocused: false })}
            onChange={this.onChange}
            placeholder={this.props.placeholder}
            setRef={(editor) => this.domEditor = editor}
            spellCheck
          />
          <input className={styles.editorInput} value="" tabIndex="-1" />
        </div>
        <WysiwygBottomControls onClick={this.toggleFullScreen} />
      </div>
    );
  }
}

// NOTE: handle defaultProps!
Wysiwyg.defaultProps = {
  autoFocus: false,
  onChange: () => {},
  placeholder: '',
  value: '',
};

Wysiwyg.propTypes = {
  autoFocus: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};

export default Wysiwyg;
