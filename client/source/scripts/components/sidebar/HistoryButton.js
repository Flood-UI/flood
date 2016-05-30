import classnames from 'classnames';
import React from 'react';
import SettingsIcon from '../icons/SettingsIcon';
import UIActions from '../../actions/UIActions';

class HistoryButton extends React.Component {
  handleHistoryClick() {
    UIActions.displayModal({id: 'history'});
  }

  render() {
    return (
      <div className="sidebar__actions__item">
        <a className="sidebar__icon-button"
          onClick={this.handleHistoryClick}>
          <SettingsIcon />
        </a>
      </div>
    );
  }
}

HistoryButton.defaultProps = {

};

HistoryButton.propTypes = {

};

export default HistoryButton;
