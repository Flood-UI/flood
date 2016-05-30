import classnames from 'classnames';
import React from 'react';

import EventTypes from '../../constants/EventTypes';
import Modal from './Modal';
import SettingsSpeedLimit from './SettingsSpeedLimit';
import SettingsStore from '../../stores/SettingsStore';

const METHODS_TO_BIND = [
  // 'handleSettingsChange',
  // 'handleSaveSettingsClick',
  // 'handleSettingsFetchRequestSuccess'
];

export default class HistoryModal extends React.Component {
  constructor() {
    super();

    this.state = {

    };

    METHODS_TO_BIND.forEach((method) => {
      this[method] = this[method].bind(this);
    });
  }

  componentDidMount() {

  }

  componentWillUnmount() {
    SettingsStore.unlisten(EventTypes.SETTINGS_FETCH_REQUEST_SUCCESS, this.handleSettingsFetchRequestSuccess);
  }

  getActions() {
    let icon = null;
    let primaryButtonText = 'Add Torrent';

    if (this.state.isAddingTorrents) {
      icon = <LoadingIndicatorDots viewBox="0 0 32 32" />;
      primaryButtonText = 'Adding...';
    }

    return [
      {
        clickHandler: null,
        content: 'Cancel',
        triggerDismiss: true,
        type: 'secondary'
      },
      {
        clickHandler: this.handleSaveSettingsClick,
        content: 'Save Settings',
        triggerDismiss: false,
        type: 'primary'
      }
    ];
  }

  render() {
    let tabs = {
      'speed-limit': {
        content: <span>Ugh</span>,
        props: {
          onSettingsChange: this.handleSettingsChange,
          settings: this.state.settings
        },
        label: 'Speed Limits'
      }
    };

    return (
      <Modal actions={this.getActions()} size="large"
        heading="History" orientation="vertical" dismiss={this.props.dismiss}
        tabs={tabs} />
    );
  }
}
