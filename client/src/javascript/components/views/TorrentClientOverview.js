import React from 'react';

import ActionBar from '../torrent-list/ActionBar';
import Alerts from '../alerts/Alerts';
import ApplicationContent from '../layout/ApplicationContent';
import ApplicationPanel from '../layout/ApplicationPanel';
import ApplicationView from '../layout/ApplicationView';
import Modals from '../modals/Modals';
import SettingsStore from '../../stores/SettingsStore';
import Sidebar from '../sidebar/Sidebar';
import NewTorrentListContainer from '../torrent-list/NewTorrentListContainer';

export default class TorrentCLientOverview extends React.Component {
  componentDidMount() {
    SettingsStore.fetchClientSettings();
    SettingsStore.fetchFloodSettings();
  }

  render() {
    return (
      <ApplicationView>
        <Sidebar />
        <ApplicationContent>
          <ApplicationPanel modifier="torrent-list" className="view--torrent-list">
            <ActionBar />
            <NewTorrentListContainer />
          </ApplicationPanel>
          <Modals />
          <Alerts />
        </ApplicationContent>
      </ApplicationView>
    );
  }
}
