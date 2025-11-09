import React, { PureComponent } from 'react';
import EyeIcon from 'mdi-react/EyeIcon';
import KeyVariantIcon from 'mdi-react/KeyVariantIcon';
import AtIcon from 'mdi-react/AtIcon';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { withTranslation } from 'react-i18next';


const initialValues = {
  email: '',
  login: '',
  password: '',
  confirmPassword: ''
};


const style = {
  "display": "block",
  "position": "absolute"
}

class Register extends PureComponent {
  static propTypes = {
    handleSubmit: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
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
    const validationSchema = Yup.object().shape({
      email: Yup.string()
        .email(t('account.invalid-email'))
        .required(t('account.required-email')),
      password: Yup.string()
        .min(6, t('account.password-short'))
        .required(t('account.password-required')),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], t('account.password-match'))
        .required(t('account.repeat-password-required')),
    });
    return (
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ errors, touched, isSubmitting }) => (
          <Form className="form">
            <div className="form__form-group">
              <span className="form__form-group-label">{t("account.email")}</span>
              <div className="form__form-group-field">
                <div className="form__form-group-icon">
                  <AtIcon />
                </div>
                <Field tabIndex={1} name="email" type="text" className={'form-control' + (errors.email && touched.email ? ' is-invalid' : '')} />

              </div>
              <ErrorMessage name="email" component="div" style={style} className="invalid-feedback" />
            </div>

            <div className="form__form-group">
              <span className="form__form-group-label">{t("account.password")}</span>
              <div className="form__form-group-field">
                <div className="form__form-group-icon">
                  <KeyVariantIcon />
                </div>
                <Field tabIndex={2} name="password" type={showPassword ? 'text' : 'password'}
                  className={'form-control' + (errors.password && touched.password ? ' is-invalid' : '')} />
                <button
                  className={`form__form-group-button${showPassword ? ' active' : ''}`}
                  onClick={e => this.showPassword(e)}
                  type="button"
                ><EyeIcon />
                </button>

              </div>
              <ErrorMessage name="password" component="div" style={style} className="invalid-feedback" />
            </div>
            <div className="form__form-group">
              <span className="form__form-group-label">{t("account.password-repeat")}</span>
              <div className="form__form-group-field">
                <div className="form__form-group-icon">
                  <KeyVariantIcon />
                </div>
                <Field tabIndex={3} name="confirmPassword" type={showPassword_repeat ? 'text' : 'password'} className={'form-control' + (errors.confirmPassword && touched.confirmPassword ? ' is-invalid' : '')} />
                <button
                  className={`form__form-group-button${showPassword_repeat ? ' active' : ''}`}
                  onClick={e => this.showPassword_repeat(e)}
                  type="button"
                ><EyeIcon />
                </button>
              </div>
              <ErrorMessage name="confirmPassword" component="div" style={style} className="invalid-feedback" />

            </div>
            <button disabled={this.props.disabled} tabIndex={4} className="btn btn-orange account__btn account__btn--small">{t("account.create-account")}</button>
            <Link className="btn btn-outline-orange account__btn account__btn--small" to="/login">{t("account.back-to-login")}</Link>

          </Form>
        )}
      </Formik>
    );
  }
}

export default (withTranslation(['common'])(Register))
