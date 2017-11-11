import {defineMessages, injectIntl} from 'react-intl';
import React from 'react';
import AuthStore from '../../stores/AuthStore';
import LogoutIcon from '../icons/LogoutIcon';
import Tooltip from '../general/Tooltip';
import UIActions from '../../actions/UIActions';
import {browserHistory} from 'react-router';

const MESSAGES = defineMessages({
  logout: {
    id: 'sidebar.button.logout',
    defaultMessage: 'Logout'
  }
})
class LogoutButton extends React.Component {
  handleLogoutButtonClick(){
    const currentUsername = AuthStore.getCurrentUsername();
    AuthStore.logoutUser(currentUsername);
    browserHistory.push('/')
  }
  render() {

    let label = this.props.intl.formatMessage(MESSAGES.logout)
    return (
      <Tooltip
        content={label}
        onClick={this.handleLogoutButtonClick}
        position="bottom"
        wrapperClassName="sidebar__action sidebar__icon-button sidebar__icon-button--interactive tooltip__wrapper">
        <LogoutIcon />
      </Tooltip>
    );
  }
}

export default injectIntl(LogoutButton);