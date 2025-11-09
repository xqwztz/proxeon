import React, { PureComponent } from 'react';
import { Field, reduxForm } from 'redux-form';
import EyeIcon from 'mdi-react/EyeIcon';
import KeyVariantIcon from 'mdi-react/KeyVariantIcon';
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

  constructor() {
    super();
    this.state = {
      showPassword: false,
      showPassword_repeat: false
    };
  }

  showPassword = (e) => {
    e.preventDefault();
    this.setState(prevState => ({ showPassword: !prevState.showPassword }));
  };
  showPassword_repeat = (e) => {
    e.preventDefault();
    this.setState(prevState => ({ showPassword_repeat: !prevState.showPassword_repeat }));
  };


  render() {
    const showPassword = this.state.showPassword;
    const showPassword_repeat = this.state.showPassword_repeat;
    const { t, handleSubmit } = this.props

    return (
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__form-group">
          <span className="form__form-group-label">{t('account.password')}</span>
          <div className="form__form-group-field">
            <div className="form__form-group-icon">
              <KeyVariantIcon />
            </div>
            <Field
              name="password"
              component={renderField}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('account.password')}
            />
            <button
              className={`form__form-group-button${showPassword ? ' active' : ''}`}
              onClick={e => this.showPassword(e)}
              type="button"
            ><EyeIcon />
            </button>
          </div>
        </div>
        <div className="form__form-group">
          <span className="form__form-group-label">{t('account.password-repeat')}</span>
          <div className="form__form-group-field">
            <div className="form__form-group-icon">
              <KeyVariantIcon />
            </div>
            <Field
              name="password_repeat"
              component={renderField}
              type={showPassword_repeat ? 'text' : 'password'}
              placeholder={t('account.password-repeat')}
            />
            <button
              className={`form__form-group-button${showPassword_repeat ? ' active' : ''}`}
              onClick={e => this.showPassword_repeat(e)}
              type="button"
            ><EyeIcon />
            </button>
          </div>
        </div>
        <button disabled={this.props.disabled} className="btn btn-orange account__btn account__btn--small">{t('account.reset')}</button>
        <Link className="btn btn-outline-orange account__btn account__btn--small" to="/login">{t('account.back-to-login')}</Link>
      </form>
    );
  }
}

export default reduxForm({
  form: 'resetPassw_form',
})((withTranslation('common'))(Passw));
