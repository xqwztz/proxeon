import React, { useState, useEffect } from 'react';
import PasswForm from './components/PasswForm';
import { accountService, alertService } from '~root/_services';
import queryString from 'query-string';
import { withTranslation } from 'react-i18next';
import TopbarLanguage from "~root/containers/Layout/topbar/TopbarLanguage"
import { history } from '~root/_helpers/history'

function Password({ t, i18n }) {
  const TokenStatus = {
    Validating: 'Validating',
    Valid: 'Valid',
    Invalid: 'Invalid'
  }

  const [token, setToken] = useState(null);
  const [disabled, changeDisabled] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(TokenStatus.Validating);

  useEffect(() => {
    const { token } = queryString.parse(window.location.search);

    // remove token from url to prevent http referer leakage
    history.replace(window.location.pathname);



    accountService.validateResetToken(token, i18n.language)
      .then(() => {
        setToken(token);
        setTokenStatus(TokenStatus.Valid);
      })
      .catch(() => {
        setTokenStatus(TokenStatus.Invalid);
      });

  }, []);




  const handleSubmit = (fields) => {
    alertService.clear();
    changeDisabled(true)
    accountService.forgotPassword(fields.email, i18n.language)
      .then(() => {
        alertService.success(t('account.reset-success'))
        changeDisabled(false)
      })
      .catch(error => {
        alertService.error(error)
        changeDisabled(false)
      })
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

          <PasswForm onSubmit={handleSubmit} disabled={disabled}/>
        </div>
      </div>
    </div>
  )
};

export default (withTranslation('common'))(Password);

// if you want to add select, date-picker and time-picker in your app you need to uncomment the first
// four lines in /scss/components/form.scss to add styles
