import React, { Component } from "react";
import { slideService } from "~root/_services/slide.service";
import { alertService } from "~root/_services/alert.service";
import { fetchWrapper } from "~root/_helpers/fetch-wrapper";
import Form from "react-bootstrap/Form";
import { withTranslation } from "react-i18next";

class Slides extends Component {
  constructor() {
    super();
    this.state = { slides: [], loaded: false };
  }

  componentDidMount = () => {
    this.getSlides();
  };

  getSlides = () => {
    const ref = this;

    slideService
      .getAll(this.props.room_id)
      .then((res) => {
        let slides_components = res.map((item, index) => {
          return (
            <div
              key={"slide" + index}
              className="d-flex flex-row justify-content-between align-items-center m-2 p-2 border-top"
            >
              <p>{item.localName}</p>
              <button
                style={{ margin: "0" }}
                className="btn btn-orange"
                onClick={() => ref.deleteSlides(item.id)}
              >
                {this.props.t("slides.delete")}
              </button>
            </div>
          );
        });
        ref.setState({ slides: slides_components, loaded: true });
      })
      .catch((err) => {
        console.log(err);
      });
  };

  deleteSlides = (id) => {
    this.setState({ loaded: false });
    slideService
      .del(id)
      .then(() => this.getSlides())
      .catch((err) => {
        alertService.error(err);
      });
  };

  handlePresentationUpload = (e) => {
    if (e.target.files) {
      if (e.target.files[0].type !== "application/pdf") {
        alertService.error(this.props.t("slides.choose-pdf"));
        return;
      } else if (e.target.files[0].size / 1024 / 1024 >= 100) {
        alertService.error(this.props.t("slides.too-big") + 100 + "MB");
        return;
      }

      this.uploadFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  uploadFile = (file) => {
    this.setState({ loaded: false });
    fetchWrapper
      .postFile(
        process.env.REACT_APP_SERVER_URL +
          "/slides/upload/" +
          this.props.room_id,
        file
      )
      .then((status) => {
        if (status === 200) {
          this.getSlides();
          alertService.success("OK");
        }
      })
      .catch((err) => {
        alertService.error(err);
      });
  };

  render() {
    return (
      <div>
        {this.state.loaded ? (
          <>
            {this.state.slides}
            <Form
              className="mt-2 mb-2"
              onChange={this.handlePresentationUpload}
            >
              <Form.File custom>
                <Form.File.Input />
                <Form.File.Label data-browse="Wybierz plik">
                  {this.props.t("slides.upload-new-presentation")}
                </Form.File.Label>
              </Form.File>
            </Form>
            <button
              className="btn btn-orange btn-block"
              onClick={this.props.backToForm}
            >
              {this.props.t("slides.back")}
            </button>
          </>
        ) : (
          <div className="m-2 p-2">
            <svg className="load__icon">
              <path
                fill={
                  process.env.REACT_APP_DOMAIN.toLowerCase() === "hxspace" || window.location.hostname==="ropibrwarszawa.hxspace.pl"
                    ? "#1A3586"
                    : "#9ed761"
                }
                d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
}

export default withTranslation("common")(Slides);
