import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { ThemeProps, RTLProps, ColorProps } from '~root/shared/prop-types/ReducerProps';

class MainWrapper extends PureComponent {
  static propTypes = {
    theme: ThemeProps.isRequired,
    rtl: RTLProps.isRequired,
    color: ColorProps.isRequired,
    children: PropTypes.element.isRequired,
    location: PropTypes.shape({}).isRequired,
  };

  render() {
    const {
      theme, children, rtl, location, color
    } = this.props;


    const direction = location.pathname === '/' ? 'ltr' : rtl.direction;

    return (
      <div className={`${theme.className} ${direction}-support ${color.color}`} dir={direction}>
        <div className="wrapper">
          {children}
        </div>
      </div>
    );
  }
}

export default withRouter(connect(state => ({
  theme: state.theme,
  rtl: state.rtl,
  color: state.color
}))(MainWrapper));
