import React, { Component } from "react";
import { Card, CardBody, Col, Row, Container } from "reactstrap";
import { withTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faPlusSquare } from "@fortawesome/free-regular-svg-icons";
import $ from "jquery";
import RoomForm from "./RoomForm";
import { roomService, alertService, accountService } from "~root/_services";
import RoomCard from "./RoomCard";
import SelectedRoom from "./SelectedRoom";
import TabNavigation from "./TabNavigation";
import Confirm from "~root/shared/Confirm";
import io from "socket.io-client";
import ReactDOM from "react-dom";

const socket = io(process.env.REACT_APP_SERVER_URL);

class Rooms extends Component {
  constructor() {
    super();
    this.state = {
      visible: false,
      create: true,
      update: false,
      rooms: [],
      current: null,
      selected_room: null,
      meetings: [],
      btn_disabled: false,
      showUpload: false,
    };
  }

  componentDidMount = async () => {
    this.setState({ lang: this.props.i18n.language });
    this.getRooms();
    socket.connect();
    const ref = this;
    socket.on("end", function (data) {
      if (ref.state.selected_room.id === data) {
        let room = ref.state.selected_room;
        room.meetingID = null;
        ref.setState({ selected_room: room }, () => {
          ref.getRooms();
        });
      }
    });
    socket.on("userStarted", async function (data) {
      if (data.room === ref.state.selected_room.id) {
        let room = ref.state.selected_room;
        room.meetingID = data.meeting;
        ref.setState({ selected_room: room }, () => {
          ref.getRooms();
        });
      }
    });
  };

  newRoom = () => {
    this.setState({
      visible: !this.state.visible,
      create: true,
      update: false,
      showUpload: false,
      current: null,
    });
  };

  getRooms = async () => {
    const ref = this;
    const rooms = await roomService.getAll(accountService.userValue.id);

    if (rooms.length > 0 && !this.state.selected_room) {
      this.props.id
        ? this.setState(
            {
              selected_room: rooms.filter((item) => {
                return item.id === this.props.id;
              })[0],
            },
            () => {
              ref.props.history.push("/rooms/" + this.state.selected_room.id);
            }
          )
        : this.setState({ selected_room: rooms[0] }, () => {
            ref.props.history.push("/rooms/" + rooms[0].id);
          });
    }

    this.setState({ rooms: rooms });
  };

  handleSubmit = async (fields) => {
    let submit = true;
    if (this.state.current === null) {
      fields.userID = accountService.userValue.id;
      await roomService
        .create(fields)
        .then(() => {
          alertService.success("OK");
        })
        .catch((error) => {
          submit = false;
          alertService.error(error);
        });
    } else {
      fields.userID = this.state.current.userID;
      await roomService
        .update(fields, this.state.current.id)
        .then(() => {
          alertService.success("OK");
        })
        .catch((error) => {
          submit = false;
          alertService.error(error);
        });
    }
    if (submit) {
      this.setState({ visible: false, current: null });
      this.getRooms();
    }
  };

  handleShowUpload = (val) => {
    this.setState({ showUpload: val });
  };

  editRoom = async (id) => {
    const data = await roomService.getById(id);
    this.setState({
      current: data,
      visible: true,
      create: false,
      update: true,
    });
  };

  handleStartJoinMeeting = async () => {
    this.props.history.push(
      "/join-room/mod/" + this.state.selected_room.mod_join_id
    );
  };

  deleteRoom = (id, name) => {
    const unmountConfirm=()=>{
      ReactDOM.unmountComponentAtNode(
        document.getElementById("modal-container")
      );
    }

    const renderConfirm = (question, description, onConfirm)=>{
      ReactDOM.render(
        <Confirm
          question={question}
          description={description}
          onConfirm={() => {
            unmountConfirm();
            onConfirm();
          }}
          onReject={unmountConfirm}
          show={true}
        />,
        document.getElementById("modal-container")
      );
    }
    

    const checkRecordings = () => {
      roomService.checkRecordings(id)
      .then(res=>{
        if(res>0)
          renderConfirm(
            ()=>{return <span>W pokoju znajdują się nagrania</span>}, 
            ()=>{return <span>Czy wciąż chcesz usunąć pokój <b>{name}</b>? Nagrania zostana usunięte razem z nim</span>}, deleteRoomConfirmed)
        else
          deleteRoomConfirmed()
      })
      .catch(err=>{
        alertService.error(err)
      })
    };


    const deleteRoomConfirmed=()=>{
      roomService.deleteRoom(id)
      .then(res=>{
        alertService.success(res)
        this.getRooms()
      })
      .catch(err=>{
        alertService.error(err)
      })
    }

    renderConfirm(
      ()=>{return <span>Czy na pewno chcesz usunąć pokój <b>{name}</b>?</span>}, 
      ()=>{return <span>Tej operacji nie da się cofnąć</span>}, checkRecordings);
  };

  render() {
    const { t } = this.props;
    let klasa = "";
    if (this.state.visible) {
      $("body").addClass("modal-open");
      klasa = "show";
    } else {
      klasa = "";
      $("body").removeClass("modal-open");
    }
    return (
      <Container className="dashboard">
        <div>
          {this.state.selected_room ? (
            <Row>
              <SelectedRoom
                room={this.state.selected_room}
                startJoinMeeting={this.handleStartJoinMeeting}
                disabled={this.state.btn_disabled}
              />
            </Row>
          ) : null}
          <Row>
            <div style={{ width: "100%" }}>
              <div className="d-flex flex-row flex-wrap">
                {this.state.rooms.map((item, index) => {
                  return (
                    <Col
                      key={"col" + index}
                      md={4}
                      xl={3}
                      sm={6}
                      onClick={(e) => {
                        if (
                          e.target.tagName.toLowerCase() !== "svg" &&
                          e.target.tagName.toLowerCase() !== "path"
                        ) {
                          this.setState({ selected_room: item });
                          this.props.history.push("/rooms/" + item.id);
                        } else e.preventDefault();
                      }}
                    >
                      <RoomCard
                        title={item.name}
                        id={item.id}
                        _id={item._id}
                        key={"room" + index}
                        selected_id={this.state.selected_room.id}
                        editRoom={this.editRoom}
                        deleteRoom={this.deleteRoom}
                      />
                    </Col>
                  );
                })}
                <Col md={4} xl={3} sm={6} onClick={this.newRoom}>
                  <Card>
                    <CardBody className="room-card-container">
                      <div className="room-card">
                        <h3 style={{ overflowWrap: "normal" }}>
                          {this.props.t("conference.new-room")}
                        </h3>
                        <FontAwesomeIcon
                          className="icon-add room-icon"
                          icon={faPlusSquare}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              </div>
              <div
                className={`modal fade ${klasa}`}
                id="createRoomModal"
                tabIndex="-1"
                role="dialog"
              >
                <div
                  className="modal-dialog modal-dialog-centered"
                  role="document"
                >
                  <div className="modal-content text-center">
                    <div className="close-icon" onClick={this.newRoom}>
                      <FontAwesomeIcon icon={faTimes} />
                    </div>
                    <div className="modal-body">
                      <div className="card-body p-sm-6">
                        <div className="card-title">
                          {this.state.create && !this.state.update ? (
                            <h3 className="create-only">
                              {t("conference.new-room")}
                            </h3>
                          ) : (
                            <h3 className="update-only">
                              {t("conference.room-settings")}
                            </h3>
                          )}
                        </div>
                        <RoomForm
                          create={this.state.create}
                          update={this.state.update}
                          handleSubmit={this.handleSubmit}
                          visible={this.state.visible}
                          current={this.state.current}
                          showUpload={this.state.showUpload}
                          handleShowUpload={this.handleShowUpload}
                        />
                      </div>
                      <div className="card-footer">
                        {this.state.create && !this.state.update ? (
                          <p className="create-only">
                            {t("conference.can-delete")}
                          </p>
                        ) : (
                          <p className="update-only">
                            {t("conference.can-adjust")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Row>
          <Row>
            <Col sm={12}>
              <Card>
                <TabNavigation selected={this.state.selected_room} />
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
    );
  }
}

export default withTranslation("common")(Rooms);
