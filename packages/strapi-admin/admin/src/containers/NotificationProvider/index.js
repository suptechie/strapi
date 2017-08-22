/*
 *
 * NotificationProvider
 *
 */

import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import NotificationsContainer from 'components/NotificationsContainer';
import { selectNotifications } from './selectors';
import { hideNotification } from './actions';


export class NotificationProvider extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <NotificationsContainer
        onHideNotification={this.props.onHideNotification}
        notifications={this.props.notifications}
      />
    );
  }
}

NotificationProvider.propTypes = {
  notifications: React.PropTypes.object.isRequired,
  onHideNotification: React.PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  notifications: selectNotifications(),
});

function mapDispatchToProps(dispatch) {
  return {
    onHideNotification: (id) => {
      dispatch(hideNotification(id));
    },
    dispatch,
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationProvider);
