import React from 'react';

import BaseIcon from './BaseIcon';

export default class LogoutIcon extends BaseIcon {
  render() {
    return (
      <svg className={`icon icon--logout ${this.props.className}`}
        viewBox={this.getViewBox()}>
         <path d = "M17,12L12,17V14H8V10H12V7L17,12M3,19V5A2,2 0 0,1 5,3H19A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19M5,19H19V5H5V19Z" />
      </svg>
    );
  }
}
