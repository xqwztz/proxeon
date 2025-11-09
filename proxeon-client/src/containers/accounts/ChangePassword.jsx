import React, { Component } from "react";
import { Card, CardBody, Col } from "reactstrap";
import EyeIcon from "mdi-react/EyeIcon";
import KeyVariantIcon from "mdi-react/KeyVariantIcon";
import { Link } from "react-router-dom";
import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { withTranslation } from "react-i18next";
import { accountService } from "~root/_services/account.service";
import { alertService } from "~root/_services/alert.service";

const initialValues = {
  prevPassword: "",
  password: "",
  confirmPassword: "",
};

const style = {
  display: "block",
  position: "absolute",
};

class ChangePassword extends Component {
  constructor() {
    super();
    this.state = {
      showPrevPassword: false,
      showPassword: false,
      showPassword_repeat: false,
      disabled: false,
    };
  }

  showPrevPassword = (e) => {
    e.preventDefault();
    this.setState((prevState) => ({
      showPrevPassword: !prevState.showPrevPassword,
    }));
  };
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

  handleSubmit = (fields) => {
    this.setState({ disabled: true });
    const ref = this;
    accountService
      .changePassword(
        accountService.userValue.id,
        fields.prevPassword,
        fields.password,
        fields.confirmPassword,
        this.props.i18n.language
      )
      .then((res) => {
        ref.setState({ disabled: false });
        ref.props.history.push("/");
        alertService.success(res);
      })
      .catch((err) => {
        alertService.error(err);
        ref.setState({ disabled: false });
      });
  };

  render() {
    const showPrevPassword = this.state.showPrevPassword;
    const showPassword = this.state.showPassword;
    const showPassword_repeat = this.state.showPassword_repeat;
    const { t } = this.props;
    const validationSchema = Yup.object().shape({
      prevPassword: Yup.string().required(t("account.required-prev-password")),
      password: Yup.string()
        .min(6, t("account.password-short"))
        .required(t("account.password-required")),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password"), null], t("account.password-match"))
        .required(t("account.repeat-password-required")),
    });
    return (
      <Col xl={5} md={7} sm={12} style={{ margin: "0 auto" }}>
        <Card>
          <CardBody>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={this.handleSubmit}
            >
              {({ errors, touched, isSubmitting }) => (
                <Form className="form">
                  <div className="form__form-group">
                    <span className="form__form-group-label">
                      {t("account.current-password")}
                    </span>
                    <div className="form__form-group-field">
                      <div className="form__form-group-icon">
                        <KeyVariantIcon />
                      </div>
                      <Field
                        tabIndex={1}
                        name="prevPassword"
                        type={showPrevPassword ? "text" : "password"}
                        className={
                          "form-control" +
                          (errors.prevPassword && touched.prevPassword
                            ? " is-invalid"
                            : "")
                        }
                      />
                      <button
                        className={`form__form-group-button${
                          showPrevPassword ? " active" : ""
                        }`}
                        onClick={(e) => this.showPrevPassword(e)}
                        type="button"
                      >
                        <EyeIcon />
                      </button>
                    </div>
                    <ErrorMessage
                      name="prevPassword"
                      component="div"
                      style={style}
                      className="invalid-feedback"
                    />
                  </div>
                  <div className="form__form-group">
                    <span className="form__form-group-label">
                      {t("account.password")}
                    </span>
                    <div className="form__form-group-field">
                      <div className="form__form-group-icon">
                        <KeyVariantIcon />
                      </div>
                      <Field
                        tabIndex={2}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        className={
                          "form-control" +
                          (errors.password && touched.password
                            ? " is-invalid"
                            : "")
                        }
                      />
                      <button
                        className={`form__form-group-button${
                          showPassword ? " active" : ""
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
                      {t("account.password-repeat")}
                    </span>
                    <div className="form__form-group-field">
                      <div className="form__form-group-icon">
                        <KeyVariantIcon />
                      </div>
                      <Field
                        tabIndex={3}
                        name="confirmPassword"
                        type={showPassword_repeat ? "text" : "password"}
                        className={
                          "form-control" +
                          (errors.confirmPassword && touched.confirmPassword
                            ? " is-invalid"
                            : "")
                        }
                      />
                      <button
                        className={`form__form-group-button${
                          showPassword_repeat ? " active" : ""
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
                  <div className="d-flex flex-row w-100 justify-content-around">
                    <button
                      style={{ width: "35%",minWidth:"100px" }}
                      disabled={this.state.disabled}
                      tabIndex={4}
                      className="btn btn-orange account__btn account__btn--small"
                    >
                      {t("account.change-password")}
                    </button>
                    <Link
                      style={{ width: "35%", minWidth:"100px", alignItems:"center", justifyContent:"center" }}
                      className="btn btn-danger account__btn account__btn--small d-flex"
                      to="/"
                    >
                      {t("account.cancel")}
                    </Link>
                  </div>
                </Form>
              )}
            </Formik>
          </CardBody>
        </Card>
      </Col>
    );
  }
}

export default withTranslation(["common"])(ChangePassword);
