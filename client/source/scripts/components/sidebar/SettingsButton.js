import React from 'react';

import SettingsIcon from '../icons/SettingsIcon';
import UIActions from '../../actions/UIActions';

class SettingsButton extends React.Component {
  constructor() {
    super();
  }

  handleSettingsButtonClick() {
    UIActions.displayModal({id: 'settings'});
  }

  render() {
    return (
      <a className="sidebar__actions__item sidebar__icon-button"
        onClick={this.handleSettingsButtonClick}>
        <SettingsIcon />
      </a>
    );
  }
}

export default SettingsButton;
