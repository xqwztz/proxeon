import React, { Component } from "react";
import { Card, CardBody } from "reactstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCogs, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

class RoomCard extends Component {
  render() {
    const class_name =
      this.props.selected_id === this.props.id ? " selected" : "";
    return (
      <Card>
        <CardBody className={`room-card-container${class_name}`}>
          <div className="room-card">
            <h3 style={{ overflowWrap: "anywhere" }}>{this.props.title}</h3>
            <div className="d-flex flex-row">
              <FontAwesomeIcon
                onClick={() => this.props.editRoom(this.props.id)}
                className="icon room-icon"
                icon={faCogs}
                style={{ cursor: "pointer", marginRight: "10px" }}
              />
              <FontAwesomeIcon
                onClick={() => this.props.deleteRoom(this.props._id, this.props.title)}
                className="icon room-icon red"
                icon={faTrashAlt}
                style={{ cursor: "pointer", marginLeft: "10px" }}
              />
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }
}

export default RoomCard;
