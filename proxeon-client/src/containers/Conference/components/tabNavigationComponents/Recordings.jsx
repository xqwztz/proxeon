import React, { Component } from "react";
import { CardBody } from "reactstrap";
import { alertService, meetingService } from "~root/_services";
import { withTranslation } from "react-i18next";
import BorderedTable from "../Table";

class Recordings extends Component {
  constructor(props) {
    super();
    this.state = {
      meetings: [],
      playingLink: "",
      current_room: props.selected,
    };
  }

  componentDidMount = () => {
    this.setState({ lang: this.props.i18n.language });
    this.getMeetings();
  };

  componentDidUpdate = () => {
    if (
      this.state.current_room !== this.props.selected ||
      (this.state.lang && this.props.i18n.language !== this.state.lang)
    ) {
      this.getMeetings();
      this.setState({
        current_room: this.props.selected,
        meetings: [],
        playingLink: "",
        lang: this.props.i18n.language,
      });
    }
  };

  showRecording = (link) => {
    this.setState({ playingLink: "" });
    this.setState({
      playingLink: link,
    });
  };

  getConvertedDate = (date) => {
    const convertedDate = new Date(date);
    const day = ("0" + convertedDate.getDate()).slice(-2);
    const month = ("0" + (parseInt(convertedDate.getMonth()) + 1)).slice(-2);
    const hours = ("0" + convertedDate.getHours()).slice(-2);
    const minutes = ("0" + convertedDate.getMinutes()).slice(-2);
    return (
      day +
      "-" +
      month +
      "-" +
      convertedDate.getFullYear() +
      " " +
      hours +
      ":" +
      minutes
    );
  };

  getMeetings = async () => {
    const states = {
      ready: this.props.t("conference.ready"),
      encoding: this.props.t("conference.encoding"),
      downloaded: this.props.t("conference.downloaded"),
    };
    const ref = this;
    if (this.props.selected)
      await meetingService
        .getMeetings(this.props.selected.id)
        .then((res) => {
          let rows = res.map((item, index) => {
            const dateToDisplay = ref.getConvertedDate(item.startDate);
            return (

                  <tr key={"meeting" + index}>
                    <td key={"name" + index}>{ref.props.selected.name}</td>
                    <td key={"date" + index}>{dateToDisplay}</td>
                    <td key={"status" + index}>
                      {states[item.recordingStatus]}
                    </td>
                    <td key={"btnContainer" + index}>
                      {item.recordingStatus === "downloaded" ? (
                        <>
                          <button
                            key={"btn" + index}
                            className="btn btn-orange"
                            onClick={() => {
                              this.showRecording(item.recordingLink);
                            }}
                          >
                            {this.props.t("conference.recording")}
                          </button>
                          <button
                            key={"btn-del" + index}
                            className="btn btn-danger"
                            onClick={() => {
                              this.deleteRecording(item.meetingID);
                            }}
                          >
                            {this.props.t("slides.delete")}
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>

            );
          });
          this.setState({ meetings: rows, playingLink:"" });
        })
        .catch((err) => {
          alertService.error(err);
        });
  };

  deleteRecording = (id) => {
    let conf = window.confirm(this.props.t("conference.confirm"));
    if (conf)
      meetingService
        .deleteRecording(id, this.props.i18n.language)
        .then((res) => {
          alertService.success(res);
          this.getMeetings();
        })
        .catch((err) => {
          alertService.error(err);
        });
  };

  render() {
    const { t } = this.props;

    return (
      <CardBody>
        <h4 className="mb-3">{t("conference.my-recordings")}:</h4>
        <button className="btn btn-orange" onClick={this.getMeetings}>
          {t("conference.refresh")}
        </button>
        {this.state.meetings.length > 0 ? (
          <BorderedTable data={this.state.meetings} />
        ) : null}
        <div>
          {this.state.playingLink !== "" ? (
            <video
              controls
              autoPlay
              width="500"
              src={this.state.playingLink}
              type="video/mp4"
            ></video>
          ) : null}
        </div>
      </CardBody>
    );
  }
}


export default withTranslation("common")(Recordings);
