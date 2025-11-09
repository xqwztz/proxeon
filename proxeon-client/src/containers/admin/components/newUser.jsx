import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import AtIcon from "mdi-react/AtIcon";
import AccountGroupOutlineIcon from "mdi-react/AccountGroupOutlineIcon";
import { accountService, alertService } from "~root/_services";
import EyeIcon from "mdi-react/EyeIcon";
import WanIcon from "mdi-react/WanIcon";

import KeyVariantIcon from "mdi-react/KeyVariantIcon";
import { withTranslation } from "react-i18next";

const initialValues = {
    login: "",
    email: "",
    role: "User",
    password: "",
    confirmPassword: "",
    hostname: "",
};

const style = {
    display: "block",
    position: "absolute",
};

class NewUser extends Component {
    constructor() {
        super();
        this.state = {
            showPassword: false,
            showPassword_repeat: false,
        };
    }

    showPassword = (e) => {
        e.preventDefault();
        this.setState((prevState) => ({ showPassword: !prevState.showPassword }));
    };
    showPassword_repeat = (e) => {
        e.preventDefault();
        this.setState((prevState) => ({
            showPassword_repeat: !prevState.showPassword_repeat,
        }));
    };

    onSubmit = (fields, { setStatus, setSubmitting }) => {
        this.createUser(fields, setSubmitting);
    };

    createUser = (fields, setSubmitting) => {
        accountService
            .create(fields, this.props.i18n.language)
            .then(() => {
                alertService.success(this.props.t("admin.user-add-success"), {
                    keepAfterRouteChange: true,
                });
                this.props.history.push("/adminUsers");
            })
            .catch((error) => {
                setSubmitting(false);
                alertService.error(error);
            });
    };

    render() {
        const { t } = this.props;
        const validationSchema = Yup.object().shape({
            email: Yup.string()
                .email(t("admin.email-invalid"))
                .required(t("admin.email-required")),
            role: Yup.string().required(t("admin.role-required")),
            password: Yup.string()
                .concat(
                    false ? Yup.string().required(t("admin.password-required")) : null
                )
                .min(6, t("admin.password-short")),
            confirmPassword: Yup.string()
                .when("password", (password, schema) => {
                    if (password)
                        return schema.required(t("admin.password-repeat-required"));
                })
                .oneOf([Yup.ref("password")], t("admin.password-match")),
            hostname: Yup.string().required(t("admin.hostname-required")),
        });
        return (
            <div className="account__card">
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={this.onSubmit}
                >
                    {({ errors, touched, isSubmitting, setFieldValue }) => (
                        <Form className="form">
                            <h1>{t("admin.new-user")}</h1>
                            <div className="form__form-group">
                                <span className="form__form-group-label">
                                    {t("admin.user-email")}
                                </span>
                                <div className="form__form-group-field">
                                    <div className="form__form-group-icon">
                                        <AtIcon />
                                    </div>
                                    <Field
                                        name="email"
                                        type="text"
                                        className={
                                            "form-control" +
                                            (errors.email && touched.email ? " is-invalid" : "")
                                        }
                                    />
                                </div>
                                <ErrorMessage
                                    name="email"
                                    component="div"
                                    style={style}
                                    className="invalid-feedback"
                                />
                            </div>

                            <div className="form__form-group">
                                <span className="form__form-group-label">
                                    {t("admin.user-role")}
                                </span>
                                <div className="form__form-group-field">
                                    <div className="form__form-group-icon">
                                        <AccountGroupOutlineIcon />
                                    </div>
                                    <Field
                                        name="role"
                                        as="select"
                                        className={
                                            "form-control" +
                                            (errors.role && touched.role ? " is-invalid" : "")
                                        }
                                    >
                                        <option value="User">{t("admin.role-user")}</option>
                                        <option value="Admin">{t("admin.role-admin")}</option>
                                    </Field>
                                </div>
                                <ErrorMessage
                                    name="role"
                                    component="div"
                                    className="invalid-feedback"
                                />
                            </div>
                            <div className="form__form-group">
                                <span className="form__form-group-label">
                                    {t("admin.password")}
                                </span>
                                <div className="form__form-group-field">
                                    <div className="form__form-group-icon">
                                        <KeyVariantIcon />
                                    </div>
                                    <Field
                                        name="password"
                                        type={this.state.showPassword ? "text" : "password"}
                                        className={
                                            "form-control" +
                                            (errors.password && touched.password ? " is-invalid" : "")
                                        }
                                    />
                                    <button
                                        className={`form__form-group-button${this.state.showPassword ? " active" : ""
                                            }`}
                                        onClick={(e) => this.showPassword(e)}
                                        type="button"
                                    >
                                        <EyeIcon />
                                    </button>
                                </div>
                                <ErrorMessage
                                    name="password"
                                    component="div"
                                    style={style}
                                    className="invalid-feedback"
                                />
                            </div>
                            <div className="form__form-group">
                                <span className="form__form-group-label">
                                    {t("admin.password-repeat")}
                                </span>
                                <div className="form__form-group-field">
                                    <div className="form__form-group-icon">
                                        <KeyVariantIcon />
                                    </div>
                                    <Field
                                        name="confirmPassword"
                                        type={this.state.showPassword_repeat ? "text" : "password"}
                                        className={
                                            "form-control" +
                                            (errors.confirmPassword && touched.confirmPassword
                                                ? " is-invalid"
                                                : "")
                                        }
                                    />
                                    <button
                                        className={`form__form-group-button${this.state.showPassword_repeat ? " active" : ""
                                            }`}
                                        onClick={(e) => this.showPassword_repeat(e)}
                                        type="button"
                                    >
                                        <EyeIcon />
                                    </button>
                                </div>
                                <ErrorMessage
                                    name="confirmPassword"
                                    component="div"
                                    style={style}
                                    className="invalid-feedback"
                                />
                            </div>
                            <div className="form__form-group">
                                <span className="form__form-group-label">
                                    {t("admin.hostname")}
                                </span>
                                <div className="form__form-group-field">
                                    <div className="form__form-group-icon">
                                        <WanIcon />
                                    </div>
                                    <Field
                                        name="hostname"
                                        type="text"
                                        className={
                                            "form-control" +
                                            (errors.password && touched.password ? " is-invalid" : "")
                                        }
                                    />
                                </div>
                                <ErrorMessage
                                    name="hostname"
                                    component="div"
                                    style={style}
                                    className="invalid-feedback"
                                />
                            </div>

                            <div className="form-group">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-outline-orange"
                                >
                                    {isSubmitting && (
                                        <span className="spinner-border spinner-border-sm mr-1"></span>
                                    )}
                                    {t("admin.save")}
                                </button>
                                <Link to={"/adminUsers"} className="btn btn-orange">
                                    {t("admin.cancel")}
                                </Link>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        );
    }
}

export default withTranslation("common")(NewUser);
