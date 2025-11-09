import React, { useState} from 'react';
import RegisterForm from './components/RegisterForm';
import { accountService, alertService } from '~root/_services';
import { withTranslation } from 'react-i18next';
import TopbarLanguage from "~root/containers/Layout/topbar/TopbarLanguage"


function Register({ i18n,t, history }) {
  const [disabled, changeDisabled] = useState(false);

  const handleSubmit = (fields) => {
    changeDisabled(true)
    accountService.register(fields,i18n.language)
      .then(() => {
        alertService.success(t('account.register-success'), { keepAfterRouteChange: true });
        history.push('login');
        changeDisabled(false)
      })
      .catch(error => {
        changeDisabled(false)
        alertService.error(error);
      });
  }
  return (
    <div className="account">
      <div className="account__wrapper" style={{ "position": "relative" }}>
        <div style={{"position":"absolute", "top":"20px", "right":"15px"}}>
          <TopbarLanguage/>
        </div>
        <div className="account__card">
          <div className="account__head" style={{ "paddingTop": "2px" }}>

          </div>
          <RegisterForm handleSubmit={handleSubmit} disabled={disabled}/>
        </div>
      </div>
    </div>
  )
};

export default (withTranslation('common'))(Register);

// if you want to add select, date-picker and time-picker in your app you need to uncomment the first
// four lines in /scss/components/form.scss to add styles
