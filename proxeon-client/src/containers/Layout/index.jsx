import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Topbar from './topbar/Topbar';
import Sidebar from './sidebar/Sidebar';
import { changeColorToOrange, changeColorToBlue, changeColorToGreen, changeColorToRed, changeColorToSaunier, changeColorToVaillant } from '~root/redux/actions/colorActions';
import { changeThemeToDark, changeThemeToLight } from '~root/redux/actions/themeActions';
import { changeMobileSidebarVisibility, changeSidebarVisibility } from '~root/redux/actions/sidebarActions';
import { SidebarProps } from '~root/shared/prop-types/ReducerProps';
import { accountService } from '~root/_services'

class Layout extends Component {
  static propTypes = {
    dispatch: PropTypes.func.isRequired,
    sidebar: SidebarProps.isRequired,
  };

  changeSidebarVisibility = () => {
    const { dispatch } = this.props;
    dispatch(changeSidebarVisibility());
  };

  changeMobileSidebarVisibility = () => {
    const { dispatch } = this.props;
    dispatch(changeMobileSidebarVisibility());
  };

  changeToDark = () => {
    const { dispatch } = this.props;
    dispatch(changeThemeToDark());
  };

  changeToLight = () => {
    const { dispatch } = this.props;
    dispatch(changeThemeToLight());
  };

  componentDidMount = () => {
    if ((accountService.userValue && accountService.userValue.role === "User") || !accountService.userValue)
      this.changeSidebarVisibility()

    const user = accountService.userValue
    const { dispatch } = this.props;
    if (user)
      switch (user.color) {
        case 'orange':
          dispatch(changeColorToOrange())
          break;
        case 'green':
          dispatch(changeColorToGreen())
          break;
        case 'blue':
          dispatch(changeColorToBlue())
          break;
        case 'red':
          dispatch(changeColorToRed())
          break;
        case 'saunier':
          dispatch(changeColorToSaunier())
          break;
        case 'vaillant':
          dispatch(changeColorToVaillant())
          break;
        default:
          dispatch(changeColorToRed())
          break;
      }
    else{
      process.env.REACT_APP_DOMAIN.toLowerCase()==='hxspace' || window.location.hostname==="ropibrwarszawa.hxspace.pl"?
      dispatch(changeColorToBlue())
      :
      dispatch(changeColorToGreen())

    }


  }

  render() {
    const { sidebar } = this.props;

    const layoutClass = classNames({
      layout: true,
      'layout--collapse': sidebar.collapse,
    });


    return (
      <>
        <div className={layoutClass}>
          <Topbar
            changeMobileSidebarVisibility={this.changeMobileSidebarVisibility}
            changeSidebarVisibility={this.changeSidebarVisibility}
          />
        </div>
      </>
    );
  }
}

export default withRouter(connect(state => ({
  sidebar: state.sidebar,
}))(Layout));
