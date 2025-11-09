import React, { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import DownIcon from 'mdi-react/ChevronDownIcon';
import Collapse from 'react-bootstrap/Collapse';
import { accountService } from '~root/_services'
import { withTranslation } from 'react-i18next';


const Ava = `${process.env.PUBLIC_URL}/img/ava.png`;

class TopbarProfile extends PureComponent {
  constructor() {
    super();
    this.state = {
      collapse: false,
    };
  }

  toggle = () => {
    this.setState(prevState => ({ collapse: !prevState.collapse }));
  };


  render() {
    const user = accountService.userValue;
    // const { collapse } = this.state;

    return (
      <>
        {
          user ?
            <div className="topbar__profile">
              <button type="button" className="topbar__avatar" onClick={this.toggle}>

                <img className="topbar__avatar-img" src={Ava} alt="avatar" />

                <p className="topbar__avatar-name">{user.email}</p>
                <DownIcon className="topbar__icon" />
              </button>
              {this.state.collapse && <button type="button" className="topbar__back" onClick={this.toggle} />}
              <Collapse in={this.state.collapse} className="topbar__menu-wrap">
                <div className="topbar__menu">

                  <Link className="topbar__link" to="/changePassword">
                    <span className={`topbar__link-icon lnr lnr-cog`} />
                    <p className="topbar__link-title">{this.props.t('layout.change-passw')}</p>
                  </Link>
                  {user && user.role === "Admin" ?
                    <Link className="topbar__link" to="/adminUsers">
                      <span className={`topbar__link-icon lnr lnr-users`} />
                      <p className="topbar__link-title">{this.props.t('layout.users')}</p>
                    </Link>
                    : null}
                    {user && user.role === "Admin" ?
                      <Link className="topbar__link" to="/adminReports">
                        <span className={`topbar__link-icon lnr lnr-pie-chart`} />
                        <p className="topbar__link-title">{this.props.t('layout.reports')}</p>
                      </Link>
                    : null}
                  <Link className="topbar__link" to="/" onClick={() => { accountService.logout(this.props.i18n.language) }}>
                    <span className={`topbar__link-icon lnr lnr-exit`} />
                    <p className="topbar__link-title">{this.props.t('layout.log-out')}</p>
                  </Link>
                  

                </div>
              </Collapse>
            </div>
            :
            null}
      </>
    );
  }
}
export default (withTranslation('common'))(TopbarProfile)