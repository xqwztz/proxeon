import React, {  useState } from 'react';
import LogInForm from './components/LogInForm';
import { accountService, alertService } from '~root/_services';
import TopbarLanguage from "~root/containers/Layout/topbar/TopbarLanguage"
import { withTranslation } from 'react-i18next'
import { history } from '~root/_helpers/history'

function LogIn({ i18n }) {

  const [disabled, changeDisabled] = useState(false);

  const handleSubmit = ({ email, password }, { setSubmitting }) => {
    alertService.clear();
    changeDisabled(true)
    accountService.login(email, password, i18n.language)
      .then((user) => {
        const { from } = window.location.state || { from: { pathname: "/" } };

        history.push(from);
        changeDisabled(false)

      })
      .catch(error => {
        setSubmitting(false);
        alertService.error(error);
        changeDisabled(false)

      });
  }

  return (
    <div className="account">
      <div className="account__wrapper" style={{ "position": "relative" }}>
        <div style={{ "position": "absolute", "top": "20px", "right": "15px" }}>
          <TopbarLanguage />
        </div>
        <div className="account__card">
          <div className="account__head" style={{ "paddingTop": "2px" }}>
          </div>
          <LogInForm onSubmit={handleSubmit} disabled={disabled}/>
        </div>
      </div>
    </div>);
}

export default (withTranslation('common'))(LogIn);

// if you want to add select, date-picker and time-picker in your app you need to uncomment the first
// four lines in /scss/components/form.scss to add styles
