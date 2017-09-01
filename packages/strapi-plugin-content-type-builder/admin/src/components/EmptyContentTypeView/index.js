/**
*
* EmptyContentTypeView
*
*/

import React from 'react';
import { FormattedMessage } from 'react-intl';
import Button from 'components/Button';
import Brush from '../../assets/images/paint_brush.svg';
import styles from './styles.scss';

class EmptyContentTypeView extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div className={styles.emptyContentTypeView}>
        <img src={Brush} role="presentation" />
        <div>
          <FormattedMessage id="home.emptyContentType.title">
            {(title) => <div className={styles.title}>{title}</div>}
          </FormattedMessage>
          <FormattedMessage id="home.emptyContentType.description">
            {(description) => <div className={styles.description}>{description}</div>}
          </FormattedMessage>
          <div className={styles.buttonContainer}>
            <Button
              onClick={this.props.handleButtonClick}
              buttonBackground={'primary'}
              label={'button.contentType.create'}
              addShape
              handlei18n
            />
          </div>
        </div>

      </div>
    );
  }
}

EmptyContentTypeView.propTypes = {
  handleButtonClick: React.PropTypes.func,
};

export default EmptyContentTypeView;
