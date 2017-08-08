/**
*
* RowLanguage
*
*/

import React from 'react';
import { find, get, join, isObject } from 'lodash';
import { FormattedMessage } from 'react-intl';
import PopUpWarning from 'components/PopUpWarning';
// utils
import getFlag, { formatLanguageLocale } from '../../utils/getFlag';

class RowLanguage extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);
    this.state = {
      showWarning: false,
    };
  }

  deleteLanguage = () => {
    this.setState({ showWarning: !this.state.showWarning });
    this.props.handleLanguageDelete(this.props.name);
  }

  toggleWarning = () => this.setState({ showWarning: !this.state.showWarning });

  render() {
    // assign the target id the language name to prepare for delete
    const deleteIcon = this.props.active ? '' : <i className="fa fa-trash"  onClick={this.toggleWarning} id={this.props.name} />; // eslint-disable-line jsx-a11y/no-static-element-interactions

    // format the locale to
    const defaultLanguageArray = formatLanguageLocale(this.props.name);
    const flag = getFlag(defaultLanguageArray);
    // retrieve language name from i18n translation
    const languageObject = find(get(this.props.listLanguages, ['sections', '0', 'items', '0', 'items']), ['value', join(defaultLanguageArray, '_')]);
    // apply i18n
    const languageDisplay = isObject(languageObject) ? <FormattedMessage {...{ id: languageObject.name }} /> : '';

    const languageLabel = this.props.active ?
      <span className={this.props.liStyles.italicText}>
        <FormattedMessage {...{id: 'list.languages.default.languages'}} />
      </span> :
      // set the span's id with the language name to retrieve it
        <FormattedMessage {...{id: 'list.languages.set.languages'}}>
          {(message) => (
            <button className={this.props.liStyles.normal} onClick={this.props.changeDefaultLanguage} id={this.props.name}>
              {message}
            </button>
          )}
        </FormattedMessage>;

    return (
      <li>
        <div className={this.props.liStyles.flexLi}>
          <div className={this.props.liStyles.flexed}>
            <div><span className={`flag-icon flag-icon-${flag}`} /></div>
            <div className={`${this.props.liStyles.label} ${this.props.liStyles.capitalized}`}>{languageDisplay}</div>
          </div>
          <div>{this.props.name}</div>
          <div className={this.props.liStyles.centered}>{languageLabel}</div>
          <div className={this.props.liStyles.trashContainer}>{deleteIcon}</div>
        </div>
        <div>
          <PopUpWarning
            isOpen={this.state.showWarning}
            toggleModal={this.toggleWarning}
            handleConfirm={this.deleteLanguage}
            warningMessage={'popUpWarning.languages.delete.message'}
          />
        </div>
        <div className={this.props.liStyles.spacer} />

      </li>
    );
  }
}

RowLanguage.propTypes = {
  active: React.PropTypes.bool,
  changeDefaultLanguage: React.PropTypes.func.isRequired,
  handleLanguageDelete: React.PropTypes.func.isRequired,
  listLanguages: React.PropTypes.object.isRequired,
  liStyles: React.PropTypes.object,
  name: React.PropTypes.string.isRequired,
};

export default RowLanguage;
