import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string';
import { withTranslation } from 'react-i18next';
import TopbarLanguage from "~root/containers/Layout/topbar/TopbarLanguage"

import { accountService, alertService } from '~root/_services';

function VerifyEmail({i18n, t, history }) {
    const EmailStatus = {
        Verifying: 'Verifying',
        Failed: 'Failed'
    }

    const [emailStatus, setEmailStatus] = useState(EmailStatus.Verifying);

    useEffect(() => {
        const { token } = queryString.parse(window.location.search);

        // remove token from url to prevent http referer leakage
        history.replace(window.location.pathname);

        accountService.verifyEmail(token,i18n.language)
            .then(() => {
                alertService.success(t('account.verify-email-success'), { keepAfterRouteChange: true });
                history.push('login');
            })
            .catch(() => {
                setEmailStatus(EmailStatus.Failed);
            });
    }, []);

    function getBody() {
        switch (emailStatus) {
            case EmailStatus.Verifying:
                return <div>{t('account.verify-loading')}</div>;
            case EmailStatus.Failed:
                return <div>{t('account.verify-email-fail-1')} <Link to="forgot-password">{t('account.verify-email-fail-2')}</Link>.</div>;
        }
    }

    return (
        <div>
            <div style={{ "position": "absolute", "top": "20px", "right": "15px" }}>
                <TopbarLanguage />
            </div>
            <h3 className="card-header">{t('account.verify-email')}</h3>
            <div className="card-body">{getBody()}</div>
        </div>
    )
}

export default (withTranslation('common'))(VerifyEmail); 