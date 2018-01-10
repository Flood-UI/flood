import {AutoSizer, Grid} from 'react-virtualized';
import React, {Component} from 'react';

import EventTypes from '../../constants/EventTypes';
import ProgressBar from '../general/ProgressBar';
import SettingsStore from '../../stores/SettingsStore';
import TorrentDetail from '../../components/torrent-list/TorrentDetail';
import { torrentStatusIcons } from '../../util/torrentStatusIcons';
import TorrentStore from '../../stores/TorrentStore';

const condensedValueTransformers = {
  downloadTotal: torrent => torrent.bytesDone,
  peers: torrent => torrent.peersConnected,
  percentComplete: torrent => {
    return (
      <ProgressBar percent={torrent.percentComplete}
        icon={torrentStatusIcons(torrent.status)} />
    );
  },
  seeds: torrent => torrent.seedsConnected
};

const condensedSecondaryValueTransformers = {
  peers: torrent => torrent.peersTotal,
  seeds: torrent => torrent.seedsTotal
};

const defaultPropWidths = {
  name: 200,
  eta: 100
}

class TorrentListContainer extends Component {
  state = {
    displayedProperties: SettingsStore.getFloodSettings('torrentDetails'),
    torrentListColumnWidths:
      SettingsStore.getFloodSettings('torrentListColumnWidths'),
    torrentListViewSize:
      SettingsStore.getFloodSettings('torrentListViewSize')
  };

  componentDidMount() {
    SettingsStore.listen(
      EventTypes.SETTINGS_CHANGE,
      this.handleSettingsChange
    );
    TorrentStore.listen(
      EventTypes.CLIENT_TORRENTS_REQUEST_SUCCESS,
      this.handleTorrentRequestSuccess
    );
  }

  cellRenderer = ({columnIndex, key, rowIndex, style}) => {
    const torrent = this.state.torrents[rowIndex];
    const displayedProp = this.state.displayedProperties[columnIndex];

    console.log('render cell', columnIndex, rowIndex);

    const propId = displayedProp.id;
    let value = torrent[propId];

    let secondaryValue;

    if (propId in condensedValueTransformers) {
      value = condensedValueTransformers[propId](torrent);
    }

    if (propId in condensedSecondaryValueTransformers) {
      secondaryValue = condensedSecondaryValueTransformers[propId](torrent);
    }

    // return <div key={key} style={style}>{value}</div>;
    return (
      <TorrentDetail
        className="table__cell"
        key={key}
        preventTransform={propId === 'percentComplete'}
        secondaryValue={secondaryValue}
        slug={propId}
        value={value}
        width={this.getColumnWidth({ index: columnIndex })}
      />
    );
  };

  handleTorrentRequestSuccess = () => {
    console.log('torrents request success');
    const torrents = TorrentStore.getTorrents();

    this.setState({
      torrents,
      torrentCount: torrents.length,
      torrentRequestError: false,
      torrentRequestSuccess: true
    });
  };

  noContentRenderer() {
    return <div>no content</div>;
  }

  getColumnWidth({index}) {
    console.log(this.state.displayedProperties);
    // console.log('displayed prop', this.state.displayedProperties[index]);
    console.log('getColumnWidth', this.state.torrentListColumnWidths);
    return 100;
  }

  getRowHeight() {
    console.log('getRowHeight', arguments);
    return 30;
  }

  handleSettingsChange = () => {
    this.setState({
      displayedProperties: SettingsStore.getFloodSettings('torrentDetails'),
      torrentListColumnWidths:
        SettingsStore.getFloodSettings('torrentListColumnWidths'),
      torrentListViewSize:
        SettingsStore.getFloodSettings('torrentListViewSize')
    });
  };

  render() {
    console.log(this.state.displayedProperties.length);
    return (
      <div style={{flex: '1 1 auto'}}>
        <AutoSizer>
          {({ height, width }) => (
            <Grid
              cellRenderer={this.cellRenderer}
              className="foo"
              columnWidth={this.getColumnWidth}
              columnCount={this.state.displayedProperties.length}
              height={height}
              noContentRenderer={this.noContentRenderer}
              overscanColumnCount={1}
              overscanRowCount={1}
              rowHeight={this.getRowHeight}
              rowCount={this.state.torrentCount}
              width={width}
            />
          )}
        </AutoSizer>
      </div>
    );
  }
}

export default TorrentListContainer;
