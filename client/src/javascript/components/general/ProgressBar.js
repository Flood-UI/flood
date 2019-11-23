import React from 'react';

import styles from './ProgressBar.module.scss';

export default class ProgressBar extends React.PureComponent {
  render() {
    const percent = Math.round(this.props.percent);
    const style = {};

    if (percent !== 100) {
      style.width = `${percent}%`;
    }

    return (
      <div className={styles.progressBar}>
        <div className={styles.progressBar__icon}>{this.props.icon}</div>
        <div className={styles.progressBar__fill__wrapper}>
          <div className={styles.progressBar__fill} style={style} />
        </div>
      </div>
    );
  }
}
