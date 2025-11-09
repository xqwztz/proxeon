import React, { Component, useEffect } from 'react'
import { Link } from 'react-router-dom';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { history } from '~root/_helpers'
import * as Yup from 'yup';
import AtIcon from 'mdi-react/AtIcon';
import AccountGroupOutlineIcon from 'mdi-react/AccountGroupOutlineIcon';
import { accountService, alertService } from '~root/_services'
import EyeIcon from 'mdi-react/EyeIcon';
import WanIcon from 'mdi-react/WanIcon';
import KeyVariantIcon from 'mdi-react/KeyVariantIcon';
import EyedropperVariantIcon from 'mdi-react/EyedropperVariantIcon'
import { withTranslation } from 'react-i18next';

const initialValues = {
    login: '',
    email: '',
    role: '',
    password: '',
    color:'',
    hostname:''
};

const style = {
    "display": "block",
    "position": "absolute"
}

let id
class EditUser extends Component {
    constructor(props) {
        super()
        this.state = { showPassword: false,logos:[] }
    }

    componentDidMount = () => {
        const url = (this.props.location.pathname).split("/")
        url.pop()

        id = this.props.match.params.id
        // remove token from url to prevent http referer leakage
        history.replace(url.join("/"));
    }
    onSubmit = (fields, { setStatus, setSubmitting }) => {
        this.updateUser(id, fields, setSubmitting)
    }



    updateUser = (id, fields, setSubmitting) => {
        try {
            accountService.update(id, fields, this.props.i18n.language)
                .then(() => {
                    alertService.success(this.props.t('admin.update-success'), { keepAfterRouteChange: true });
                    if(accountService.userValue.id===id)
                    window.location.reload()
                    else
                    this.props.history.push('/adminUsers')
                })
                .catch(error => {
                    setSubmitting(false);
                    alertService.error(error);
                });
        }
        catch (err) {
            setSubmitting(false);
            alertService.error(err);
        }
    }

    showPassword = (e) => {
        e.preventDefault();
        this.setState(prevState => ({ showPassword: !prevState.showPassword }));
    };

    render() {
        const { t, i18n } = this.props
        const validationSchema = Yup.object().shape({
            email: Yup.string()
                .email(t('admin.email-invalid'))
                .required(t('admin.email-required')),
            role: Yup.string()
                .required(t('admin.role-required')),
            password: Yup.string()
                .concat(false ? Yup.string().required(t('admin.password-required')) : null)
                .min(6, t('admin.password-short')),
            color: Yup.string()
                .required(t('admin.color-required')),
            hostname: Yup.string()
                .required(t('admin.hostname-required'))
        });
        return (
            <div className="account__card">
                <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={this.onSubmit} >
                    {({ errors, touched, isSubmitting, setFieldValue }) => {
                        useEffect(() => {
                            accountService.getById(id, i18n.language).then(user => {
                                const fields = ['login', 'email', 'role', 'color', 'hostname'];
                                fields.forEach(field => setFieldValue(field, user[field], false));
                            });
                        }, [])

                        return (
                            <Form className="form">
                                <h1>{t('admin.edit-user')}</h1>
                                <div className="form__form-group">
                                    <span className="form__form-group-label">{t('admin.user-email')}</span>
                                    <div className="form__form-group-field">
                                        <div className="form__form-group-icon">
                                            <AtIcon />
                                        </div>
                                        <Field name="email" type="text" className={'form-control' + (errors.email && touched.email ? ' is-invalid' : '')} />
                                    </div>
                                    <ErrorMessage name="email" component="div" style={style} className="invalid-feedback" />
                                </div>

                                <div className="form__form-group">
                                    <span className="form__form-group-label">{t('admin.user-role')}</span>
                                    <div className="form__form-group-field">
                                        <div className="form__form-group-icon">
                                            <AccountGroupOutlineIcon />
                                        </div>
                                        <Field name="role" as="select" className={'form-control' + (errors.role && touched.role ? ' is-invalid' : '')}>
                                            <option value="User">{t('admin.role-user')}</option>
                                            <option value="Admin">{t('admin.role-admin')}</option>
                                        </Field>
                                    </div>
                                    <ErrorMessage name="role" component="div" className="invalid-feedback" />
                                </div>


                                <div className="form__form-group">
                                    <span className="form__form-group-label">{t('admin.color')}</span>
                                    <div className="form__form-group-field">
                                        <div className="form__form-group-icon">
                                            <EyedropperVariantIcon />
                                        </div>
                                        <Field name="color" as="select" className={'form-control' + (errors.color && touched.color ? ' is-invalid' : '')}>
                                            <option value="red">{t('admin.red')}</option>
                                            <option value="orange">{t('admin.orange')}</option>
                                            <option value="green">{t('admin.green')}</option>
                                            <option value="blue">{t('admin.blue')}</option>
                                            <option value="saunier">Saunier Duval</option>
                                            <option value="vaillant">Vaillant</option>
                                        </Field>
                                    </div>
                                    <ErrorMessage name="color" component="div" className="invalid-feedback" />
                                </div>

                                <div className="form__form-group">
                                    <span className="form__form-group-label">{t('admin.edit-password')}</span>
                                    <div className="form__form-group-field">
                                        <div className="form__form-group-icon">
                                            <KeyVariantIcon />
                                        </div>
                                        <Field name="password" type={this.state.showPassword ? 'text' : 'password'}
                                            className={'form-control' + (errors.password && touched.password ? ' is-invalid' : '')} />
                                        <button
                                            className={`form__form-group-button${this.state.showPassword ? ' active' : ''}`}
                                            onClick={e => this.showPassword(e)}
                                            type="button"
                                        ><EyeIcon />
                                        </button>
                                    </div>
                                    <ErrorMessage name="password" component="div" style={style} className="invalid-feedback" />
                                </div>
                                <div className="form__form-group">
                                    <span className="form__form-group-label">{t('admin.hostname')}</span>
                                    <div className="form__form-group-field">
                                        <div className="form__form-group-icon">
                                            <WanIcon />
                                        </div>
                                        <Field name="hostname" type='text'
                                            className={'form-control' + (errors.password && touched.password ? ' is-invalid' : '')} />
                                    </div>
                                    <ErrorMessage name="hostname" component="div" style={style} className="invalid-feedback" />
                                </div>
                                <div className="form-group">
                                    <button type="submit" disabled={isSubmitting} className="btn btn-outline-orange">
                                        {isSubmitting && <span className="spinner-border spinner-border-sm mr-1"></span>}
                                        {t('admin.save')}
                                    </button>
                                    <Link to={'/adminUsers'} className="btn btn-orange">{t('admin.cancel')}</Link>
                                </div>
                            </Form>
                        );
                    }}
                </Formik>
            </div>
        )
    }
}

export default (withTranslation('common'))(EditUser);
