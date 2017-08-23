/*
 *
 * LanguageToggle
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { selectLocale } from '../LanguageProvider/selectors';
import { changeLocale } from '../LanguageProvider/actions';
import { languages } from '../../i18n';
import { createSelector } from 'reselect';
import styles from './styles.scss';
import Toggle from 'components/Toggle';

export class LocaleToggle extends React.Component { // eslint-disable-line
  render() {
    const messages = languages.reduce((result, locale) => {
      const resultsObj = result;
      resultsObj[locale] = locale.toUpperCase();
      return resultsObj;
    }, {});

    return (
      <div className={styles.localeToggle}>
        <Toggle values={languages} messages={messages} onToggle={this.props.onLocaleToggle} />
      </div>
    );
  }
}

LocaleToggle.propTypes = {
  onLocaleToggle: React.PropTypes.func,
};

const mapStateToProps = createSelector(
  selectLocale(),
  (locale) => ({ locale })
);

export function mapDispatchToProps(dispatch) {
  return {
    onLocaleToggle: (evt) => dispatch(changeLocale(evt.target.value)),
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(LocaleToggle);
