import {FormattedMessage} from 'react-intl';
import React from 'react';

import EventTypes from '../../constants/EventTypes';
import DiskUsageStore from '../../stores/DiskUsageStore';
import Size from '../general/Size';
import Tooltip from '../general/Tooltip';
import connectStores from '../../util/connectStores';
import ProgressBar from '../general/ProgressBar';

class DiskUsage extends React.Component {
  getDisks() {
    return this.props.disks.map(d => (
      <li key={d.target} className="sidebar-filter__item sidebar__diskusage">
        <Tooltip
          content={
            <span>
              <Size value={d.used} /> Used&nbsp;&nbsp;&nbsp;
              <Size value={d.avail} /> Free
            </span>
          }
          position="top"
          wrapperClassName="diskusage__item">
          <div className="diskusage__text-row">
            {d.target}
            <span>{Math.round((100 * d.used) / d.size)}%</span>
          </div>
          <ProgressBar percent={(100 * d.used) / d.size} />
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
    );
  }
}

export default connectStores(DiskUsage, () => [{
  store: DiskUsageStore,
  event: EventTypes.DISK_USAGE_CHANGE,
  getValue: ({ store }) => ({
    disks: store.getDiskUsage()
  })
}])
