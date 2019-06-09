import {FormattedMessage} from 'react-intl';
import React from 'react';

import EventTypes from '../../constants/EventTypes';
import DiskUsageStore from '../../stores/DiskUsageStore';
import Size from '../general/Size';
import Tooltip from '../general/Tooltip';
import ProgressBar from '../general/ProgressBar';

const METHODS_TO_BIND = ['onDiskUsageChange', 'getDisks'];

export default class DiskUsage extends React.Component {
  constructor() {
    super();
    this.state = {
      disks: DiskUsageStore.getDiskUsage(),
    };

    METHODS_TO_BIND.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  componentDidMount() {
    DiskUsageStore.listen(EventTypes.DISK_USAGE_CHANGE, this.onDiskUsageChange);
  }

  componentWillUnmount() {
    DiskUsageStore.unlisten(EventTypes.DISK_USAGE_CHANGE, this.onDiskUsageChange);
  }

  onDiskUsageChange() {
    this.setState({disks: DiskUsageStore.getDiskUsage()})
  }

  getDisks() {
    return this.state.disks.map(d => (
      <li
        key={d.target}
        className="sidebar-filter__item sidebar__diskusage"
      >
        <Tooltip
          content={(
            <span>
              <Size value={d.used} /> Used&nbsp;&nbsp;&nbsp;<Size value={d.avail} /> Free
            </span>
          )}
          position="bottom"
          wrapperClassName=""
        >
          <div>
            {d.target}
            <span style={{float: 'right'}}>{Math.round(100 * d.used / d.size)}%</span>
            <ProgressBar percent={100 * d.used / d.size} />
          </div>
        </Tooltip>
      </li>
    ));
  }

  render() {
    const disks = this.getDisks();

    if (disks.length === 0) {
      return null;
    }

    return (
      <ul className="sidebar-filter sidebar__item">
        <li className="sidebar-filter__item sidebar-filter__item--heading">
          <FormattedMessage id="status.diskusage.title" defaultMessage="Disk Usage" />
        </li>
        {disks}
      </ul>
    )
  }
}
