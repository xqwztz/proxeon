import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SidebarLink from './SidebarLink';
import {accountService} from '~root/_services';
import { withTranslation } from 'react-i18next';

class SidebarContent extends Component {
  static propTypes = {
    changeToDark: PropTypes.func.isRequired,
    changeToLight: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
  };
  hideSidebar = () => {
    const { onClick } = this.props;
    onClick();
  };

  render() {
    const { t } = this.props;
    return (
      <div className="sidebar__content">
        {/* <ul className="sidebar__block">
          <SidebarCategory title="Example Pages" icon="diamond">
            <SidebarLink title="Page one" route="/pages/one" onClick={this.hideSidebar} />
            <SidebarLink title="Page two" route="/pages/two" onClick={this.hideSidebar} />
          </SidebarCategory>
        </ul> */}
        {
        accountService.userValue &&  accountService.userValue.role==="Admin"?
        <>
        <ul className="sidebar__block">
            <SidebarLink title={t('layout.create-conf')} icon="camera-video" route="/rooms" />
        </ul>

        <ul className="sidebar__block">
            <SidebarLink title={t('layout.users')} icon="users" route="/adminUsers" />
        </ul></>
        :
        null
        }
      </div>
    );
  }
}

export default (withTranslation('common'))(SidebarContent);
