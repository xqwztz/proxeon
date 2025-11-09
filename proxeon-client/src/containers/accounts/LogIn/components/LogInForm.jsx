import React, { PureComponent } from 'react';
import EyeIcon from 'mdi-react/EyeIcon';
import KeyVariantIcon from 'mdi-react/KeyVariantIcon';
import AtIcon from 'mdi-react/AtIcon';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { withTranslation } from 'react-i18next';

const initialValues = {
  email: '',
  password: '',
};


const style={
  "display":"block",
  "position" :"absolute"
}

class LogInForm extends PureComponent {
  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  };

  constructor() {
    super();
    this.state = {
      showPassword: false,
    };
  }


  showPassword = (e) => {
    e.preventDefault();
    this.setState(prevState => ({ showPassword: !prevState.showPassword }));
  };

  render() {
    const { showPassword } = this.state;
    const {t} = this.props;

    const validationSchema = Yup.object().shape({
      email: Yup.string()
        .email(t('account.invalid-email'))
        .required(t('account.required-email')),
      password: Yup.string()
        .required(t('account.password-required')),
    });

    return (
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={this.props.onSubmit}>
      {({ errors, touched, isSubmitting }) => (
        <Form className="form">
        <div className="form__form-group">
      <span className="form__form-group-label">{t('account.email')}</span>
          <div className="form__form-group-field">
            <div className="form__form-group-icon">
              <AtIcon />
            </div>
            <Field name="email" type="text" className={'form-control' + (errors.email && touched.email ? ' is-invalid' : '')} />
          </div>
          <ErrorMessage name="email" component="div" style={style} className="invalid-feedback" />
        </div>
        <div className="form__form-group">
          <span className="form__form-group-label">{t('account.password')}</span>
          <div className="form__form-group-field">
            <div className="form__form-group-icon">
              <KeyVariantIcon />
            </div>
            <Field name="password" type={showPassword ? 'text' : 'password'}
                  className={'form-control' + (errors.password && touched.password ? ' is-invalid' : '')} />
            <button
              className={`form__form-group-button${showPassword ? ' active' : ''}`}
              onClick={e => this.showPassword(e)}
              type="button"
            ><EyeIcon />
            </button>
          </div>
          <ErrorMessage name="password" component="div" style={style} className="invalid-feedback" />

          <div className="account__forgot-password">
            <a href="/forgetPassword">{t('account.forget-password')}?</a>
          </div>
        </div>

        <button disabled={this.props.disabled} className="btn btn-orange account__btn account__btn--small">{t('account.log-in')}</button>
        {/* <Link className="btn btn-outline-orange account__btn account__btn--small" to="/register">{t('account.create-account')}</Link> */}
      </Form>
      )}
      </Formik>
    );
  }
}

export default (withTranslation('common'))(LogInForm);
