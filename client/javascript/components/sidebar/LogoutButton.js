import {defineMessages, injectIntl} from 'react-intl';
import React from 'react';

import LogoutIcon from '../icons/LogoutIcon';
import Tooltip from '../general/Tooltip';
import UIActions from '../../actions/UIActions';

const MESSAGES = defineMessages({
  logout: {
    id: 'sidebar.button.logout',
    defaultMessage: 'Logout'
  }
});
const METHODS_TO_BIND = ['handleLogoutButtonClick'];

class LogoutButton extends React.Component {
  constructor() {
    super();

    this.tooltipRef = null;

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  handleLogoutButtonClick() {
    if (this.tooltipRef != null) {
      this.tooltipRef.dismissTooltip();
    }

    UIActions.displayModal({id: 'logout'});
  }

  render() {
    let label = this.props.intl.formatMessage(MESSAGES.logout);

    return (
      <Tooltip
        content={label}
        onClick={this.handleLogoutButtonClick}
        ref={(ref) => this.tooltipRef = ref}
        position="bottom"
        wrapperClassName="sidebar__action sidebar__icon-button
          sidebar__icon-button--interactive tooltip__wrapper">
        <LogoutIcon />
      </Tooltip>
    );
  }
}

export default injectIntl(LogoutButton);
