import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboardTeacher } from "@fortawesome/free-solid-svg-icons";
import { faDice } from "@fortawesome/free-solid-svg-icons";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

import Slides from "./Slides";
import { withTranslation } from "react-i18next";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import { slideService } from "~root/_services/slide.service";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

class RoomForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      form: {
        name: "",
        mute_on_start: false,
        ask_moderator: false,
        user_start_meeting: false,
        join_as_moderator: false,
        accessCode: null,
      },
      upload: false,
      file: null,
    };
  }
  componentDidUpdate = (prevProps) => {
    if (
      this.props.current !== prevProps.current &&
      this.props.current !== null
    ) {
      const form = {
        name: this.props.current.name,
        mute_on_start: this.props.current.mute_on_start,
        ask_moderator: this.props.current.ask_moderator,
        user_start_meeting: this.props.current.user_start_meeting,
        accessCode: this.props.current.accessCode
          ? this.props.current.accessCode
          : null,
      };
      this.setState({ form: form });
      this.getSlide();
      return;
    } else if (this.props.visible !== prevProps.visible) {
      const form = {
        name: "",
        mute_on_start: false,
        ask_moderator: false,
        user_start_meeting: false,
        accessCode: null,
      };
      this.setState({ form: form, file: null });
      return;
    }
  };
  handleNameChange = (e) => {
    let old_state = this.state.form;
    old_state.name = e.target.value;
    this.setState({ form: old_state });
  };
  handleMuteState = () => {
    let old_state = this.state.form;
    old_state.mute_on_start = !old_state.mute_on_start;
    this.setState({ form: old_state });
  };
  handleModConsent = () => {
    let old_state = this.state.form;
    old_state.ask_moderator = !old_state.ask_moderator;
    this.setState({ form: old_state });
  };
  handleUserStart = () => {
    let old_state = this.state.form;
    old_state.user_start_meeting = !old_state.user_start_meeting;
    this.setState({ form: old_state });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    let form = this.state.form;

    if (form.accessCode == null) delete form.accessCode;

    this.props.handleSubmit(form);
  };

  backToForm = () => {
    this.setState({ upload: false });
    this.props.handleShowUpload(false);
  };

  generateCode = () => {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    let form = this.state.form;
    form.accessCode = code;
    this.setState({ form: form });
  };

  getSlide = () => {
    const ref = this;

    slideService
      .getAll(this.props.current.id)
      .then((res) => {
        if (res.length > 0) {
          const slideURL =
            process.env.REACT_APP_SERVER_URL +
            "/slides/getPresentation/" +
            res[0].id;

          ref.setState({ file: slideURL });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  deleteCode = () => {
    let form = this.state.form;
    delete form.accessCode;
    this.setState({ form: form });
  };

  render() {
    const { t } = this.props;
    return (
      <>
        {!this.props.showUpload ? (
          <form
            acceptCharset="UTF-8"
            method="post"
            onSubmit={(e) => {
              this.handleSubmit(e);
            }}
          >
            <input name="utf8" type="hidden" value="✓" />
            <input
              type="hidden"
              name="authenticity_token"
              value="ZhTF3WiVR1C71KC06d33d1ZokerqcuPVHUNUSUuzUmksvx+3zeeRerSZ5s2JiZkffqzXNlLPRrKgGUk86fESKQ=="
            />
            <div className="input-icon mb-2">
              <span className="input-icon-addon">
                <FontAwesomeIcon icon={faChalkboardTeacher} />
              </span>
              <input
                id="create-room-name"
                className="form-control text-center"
                required={true}
                value={this.state.form.name}
                onChange={this.handleNameChange}
                placeholder="Wprowadź nazwę pokoju..."
                autoComplete="off"
                type="text"
                name="room[name]"
              />
              <div className="invalid-feedback text-left">
                {t("roomform.name-cannot-be-blank")}
              </div>
            </div>

            <div className="input-icon mb-2">
              <span
                className="input-icon-addon"
                style={{ cursor: "pointer", pointerEvents: "auto" }}
                onClick={this.generateCode}
              >
                <FontAwesomeIcon icon={faDice} />
              </span>
              <input
                name="room[access-code]"
                type="text"
                className="form-control text-center"
                value={
                  this.state.form.accessCode
                    ? t("roomform.access-code") + this.state.form.accessCode
                    : t("roomform.generate-access-code")
                }
                disabled
                style={{ backgroundColor: "white" }}
              />
              <span
                className="input-icon-addon"
                style={{ cursor: "pointer", pointerEvents: "auto" }}
                onClick={this.deleteCode}
              >
                <FontAwesomeIcon icon={faTrash} />
              </span>
            </div>

            <label className="custom-switch pl-0 mt-3 mb-3 w-100 text-left d-inline-block ">
              <span className="custom-switch-description">
                {t("roomform.mute-on-start")}
              </span>
              <input name="room[mute_on_join]" type="hidden" value="0" />
              <input
                className="custom-switch-input"
                onChange={() => {}}
                checked={this.state.form.mute_on_start}
                data-default="false"
                type="checkbox"
                value="1"
                name="room[mute_on_join]"
                id="room_mute_on_join"
              />
              <span
                className="custom-switch-indicator float-right cursor-pointer"
                onClick={this.handleMuteState}
              ></span>
            </label>

            <label className="custom-switch pl-0 mt-3 mb-3 w-100 text-left d-inline-block ">
              <span className="custom-switch-description">
                {t("roomform.require-admin-consent")}
              </span>
              <input
                name="room[require_moderator_approval]"
                type="hidden"
                value="0"
              />
              <input
                className="custom-switch-input"
                onChange={() => {}}
                checked={this.state.form.ask_moderator}
                ata-default="false"
                type="checkbox"
                value="1"
                name="room[require_moderator_approval]"
                id="room_require_moderator_approval"
              />
              <span
                className="custom-switch-indicator float-right cursor-pointer"
                onClick={this.handleModConsent}
              ></span>
            </label>

            <label className="custom-switch pl-0 mt-3 mb-3 w-100 text-left d-inline-block ">
              <span className="custom-switch-description">
                {t("roomform.allow-user-start")}
              </span>
              <input name="room[anyone_can_start]" type="hidden" value="0" />
              <input
                onChange={() => {}}
                checked={this.state.form.user_start_meeting}
                className="custom-switch-input"
                data-default="false"
                type="checkbox"
                value="1"
                name="room[anyone_can_start]"
                id="room_anyone_can_start"
              />
              <span
                className="custom-switch-indicator float-right cursor-pointer"
                onClick={this.handleUserStart}
              ></span>
            </label>

            <div className="mt-4">
              {this.props.create && !this.props.update ? (
                <input
                  type="submit"
                  name="commit"
                  value="Stwórz pokój"
                  className="create-only btn btn-orange btn-block"
                  data-disable-with={t("roomform.create-room")}
                />
              ) : (
                <>
                  <button
                    className="btn btn-orange btn-block"
                    onClick={() => this.props.handleShowUpload(true)}
                  >
                    {t("roomform.edit-presentations")}
                  </button>
                  <input
                    type="submit"
                    name="commit"
                    value="Aktualizuj ustawienia pokoju"
                    className="update-only btn btn-orange btn-block"
                    data-disable-with={t("roomform.update-room")}
                  />
                </>
              )}
            </div>
            {this.state.file ? (
              <div style={{ maxHeight: "100px" }}>
                <p>Podgląd: </p>
                <Document
                  file={this.state.file}
                  loading={
                    <div className="p-2 mt-3">
                      <svg className="load__icon">
                        <path
                          fill={
                            process.env.REACT_APP_DOMAIN.toLowerCase() ===
                            "hxspace" || window.location.hostname==="ropibrwarszawa.hxspace.pl"
                              ? "#1A3586"
                              : "#9ed761"
                          }
                          d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
                        />
                      </svg>
                    </div>
                  }
                >
                  <Page height={100} pageNumber={1} />
                </Document>
              </div>
            ) : null}
          </form>
        ) : (
          <Slides
            backToForm={this.backToForm}
            slides={this.state.slides}
            getSlides={this.getSlides}
            room_id={this.props.current.id}
          />
        )}
      </>
    );
  }
}

export default withTranslation("common")(RoomForm);
