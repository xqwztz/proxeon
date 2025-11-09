import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import TopbarProfile from './TopbarProfile';
import { accountService } from '~root/_services'
import TopbarLanguage from './TopbarLanguage';
import { fetchWrapper } from '~root/_helpers/fetch-wrapper'
import TopbarActiveUsers from './TopbarActiveUsers'

class Topbar extends PureComponent {
  static propTypes = {
    changeMobileSidebarVisibility: PropTypes.func.isRequired,
    changeSidebarVisibility: PropTypes.func.isRequired,
  };

  constructor() {
    super()
    this.state = { logoName: "", logo_loaded: false }
  }

  componentDidMount = async () => {
    let param = window.location.pathname;
    param=param.split("/")


    let logoName
    if (accountService.userValue)
      logoName = await fetchWrapper.get(process.env.REACT_APP_SERVER_URL + "/getLogoName/" + accountService.userValue.id)
    else if(param[1]==="join-room" && param[3])
      logoName = await fetchWrapper.get(process.env.REACT_APP_SERVER_URL + "/getLogoRoom/" + param[3])
    else
      logoName = await fetchWrapper.get(process.env.REACT_APP_SERVER_URL + "/getLogoName")

    this.setState({ logoName: logoName.name, logo_loaded: true })
  }

  render() {

    const user = accountService.userValue;

    return (
      <div className="topbar">
        <div className="topbar__wrapper">
          <div className="topbar__left">
            {this.state.logo_loaded ?
              <Link style={{ "backgroundImage": "url('" + process.env.REACT_APP_SERVER_URL + "/getLogo/" + this.state.logoName + "'" }} className="topbar__logo ml-3" to="/" />
              : null}
            
          </div>
          <div className="topbar__right">
          { user && user.role==="Admin" && <TopbarActiveUsers />}
            <TopbarLanguage />
            <TopbarProfile />
          </div>
        </div>
      </div>
    );
  }
}

export default Topbar;
