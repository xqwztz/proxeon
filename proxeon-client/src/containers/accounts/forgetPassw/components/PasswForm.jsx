import React, { PureComponent } from 'react';
import { Field, reduxForm } from 'redux-form';

import AtIcon from 'mdi-react/AtIcon';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { withTranslation } from 'react-i18next';

const renderField = ({
  input,
  label,
  type,
  meta: { touched, error, warning }
}) => (
    <>
      <input {...input} placeholder={label} type={type} required={true} />

    </>
  )


class Passw extends PureComponent {
  static propTypes = {
    handleSubmit: PropTypes.func.isRequired,
  };


  render() {
    const { t, handleSubmit } = this.props

    return (
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__form-group">
          <span className="form__form-group-label">{t('account.email')}</span>
          <div className="form__form-group-field">
            <div className="form__form-group-icon">
              <AtIcon />
            </div>
            <Field
              name="email"
              component={renderField}
              type="email"
              placeholder="E-mail"
            />
          </div>
        </div>
        <button disabled={this.props.disabled} className="btn btn-orange account__btn account__btn--small">{t('account.remind-password')}</button>
        <Link className="btn btn-outline-orange account__btn account__btn--small" to="/login">{t('account.back-to-login')}</Link>
      </form>
    );
  }
}

export default reduxForm({
  form: 'resetPassw_form'
})(withTranslation(['common'])(Passw));
