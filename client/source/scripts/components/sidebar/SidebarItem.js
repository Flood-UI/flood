import classnames from 'classnames';
import React from 'react';

class SidebarItem extends React.Component {
  render() {
    let classes = classnames(this.props.baseClassName, {
      [`${this.props.baseClassName}--${this.props.modifier}`]: this.props.modifier
    }, this.props.className);

    return (
      <div className={classes}>
        {this.props.children}
      </div>
    );
  }
}

SidebarItem.defaultProps = {
  baseClassName: 'sidebar__item',
  className: ''
};

SidebarItem.propTypes = {
  baseClassName: React.PropTypes.string,
  children: React.PropTypes.node,
  className: React.PropTypes.oneOfType([React.PropTypes.string,
    React.PropTypes.object]),
  modifier: React.PropTypes.string
};

export default SidebarItem;
