/**
*
* PluginCard
*
*/

import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { isEmpty, replace } from 'lodash';
import { FormattedMessage } from 'react-intl';

// Temporary picture
import Button from 'components/Button';
import InstallPluginPopup from 'components/InstallPluginPopup';
import StarsContainer from 'components/StarsContainer';
import styles from './styles.scss';

class PluginCard extends React.Component {
  state = { isOpen: false, boostrapCol: 'col-lg-4' };

  componentDidMount() {
    this.shouldOpenModal(this.props);
    window.addEventListener('resize', this.setBoostrapCol);
    this.setBoostrapCol();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.history.location.hash !== this.props.history.location.hash) {
      this.shouldOpenModal(nextProps);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.setBoostrapCol);
  }

  setBoostrapCol = () => {
    let boostrapCol = 'col-lg-4';

    if (window.innerWidth > 1680) {
      boostrapCol = 'col-lg-3';
    }

    if (window.innerWidth > 2300) {
      boostrapCol = 'col-lg-2';
    }

    this.setState({ boostrapCol });
  }

  handleClick = () => {
    if (this.props.plugin.id !== 'support-us') {
      this.props.history.push({
        pathname: this.props.history.location.pathname,
        hash: `${this.props.plugin.id}::description`,
      });
    } else {
      this.aTag.click();
    }
  }

  shouldOpenModal = (props) => {
    this.setState({ isOpen: !isEmpty(props.history.location.hash) });
  }

  render() {
    const buttonClass = !this.props.isAlreadyInstalled || this.props.showSupportUsButton ? styles.primary : styles.secondary;

    let buttonLabel = this.props.isAlreadyInstalled ? 'app.components.PluginCard.Button.label.install' : 'app.components.PluginCard.Button.label.download';

    if (this.props.showSupportUsButton) {
      buttonLabel = 'app.components.PluginCard.Button.label.support';
    }

    return (
      <div className={cn(this.state.boostrapCol, styles.pluginCard)} onClick={this.handleClick}>
        <div className={styles.wrapper}>
          <div className={styles.cardTitle}>
            <div><i className={`fa fa-${this.props.plugin.icon}`} /></div>
            <div>{this.props.plugin.name}</div>
          </div>
          <div className={styles.cardDescription}>
            <FormattedMessage id={this.props.plugin.description} />
            &nbsp;<FormattedMessage id="app.components.PluginCard.more-details" />
          </div>
          <div className={styles.cardScreenshot}>

          </div>
          <div className={styles.cardPrice}>
            <div>
              <i className={`fa fa-${this.props.plugin.isCompatible ? 'check' : 'times'}`} />
              <FormattedMessage id={`app.components.PluginCard.compatible${this.props.plugin.id === 'support-us' ? 'Community' : ''}`} />
            </div>
            <div>{this.props.plugin.price !== 0 ? `${this.props.plugin.price}€` : ''}</div>
          </div>
          <div className={styles.cardFooter}>
            <div className={styles.ratings}>
              <StarsContainer ratings={this.props.plugin.ratings} />
              <div>
                <span style={{ fontWeight: '600', color: '#333740' }}>{this.props.plugin.ratings}</span>
                <span style={{ fontWeight: '500', color: '#666666' }}>/5</span>
              </div>
            </div>
            <div>
              <Button
                className={cn(buttonClass, styles.button)}
                label={buttonLabel}
                onClick={this.handleClick}
              />
              <a
                href="mailto:hi@strapi.io?subject=I'd like to support Strapi"
                style={{ display: 'none' }}
                ref={(a) => { this.aTag = a; }}
              >
                &nbsp;
              </a>
            </div>
          </div>
        </div>
        <InstallPluginPopup
          history={this.props.history}
          isAlreadyInstalled={this.props.isAlreadyInstalled}
          isOpen={!isEmpty(this.props.history.location.hash) && replace(this.props.history.location.hash.split('::')[0], '#', '') === this.props.plugin.id}
          plugin={this.props.plugin}
        />
      </div>
    );
  }
}

PluginCard.defaultProps = {
  isAlreadyInstalled: false,
  plugin: {
    description: '',
    id: '',
    icon: '',
    name: '',
    price: 0,
    ratings: 5,
  },
  showSupportUsButton: false,
};

PluginCard.propTypes = {
  history: PropTypes.object.isRequired,
  isAlreadyInstalled: PropTypes.bool,
  plugin: PropTypes.object,
  showSupportUsButton: PropTypes.bool,
};

export default PluginCard;
