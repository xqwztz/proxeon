import React, { Component } from "react";
import { withTranslation } from "react-i18next";
import { CardBody } from "reactstrap";
import { alertService, meetingService } from "~root/_services";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";

function RenderListItem({ name }) {
  return (
    <ListItem>
      <ListItemIcon>
        <AccountCircleIcon />
      </ListItemIcon>
      <ListItemText primary={name} />
    </ListItem>
  );
}

class ActiveUsers extends Component {
  constructor(props) {
    super();
    this.state = { isMeetingRunning: true, users: [], current:props.selected };
  }

  componentDidUpdate=()=>{
      if(this.state.current!==this.props.selected){
        this.getMeetingInfo()
        this.setState({current:this.props.selected})
      }
  }

  getMeetingInfo = () => {
    if(this.props.selected)
    meetingService
      .getActiveUsers(this.props.selected._id)
      .then((res) => {
        this.setState({
          isMeetingRunning: res.isMeetingRunning,
          users: res.users,
        });
      })
      .catch((err) => {
        alertService.error(err);
      });
  };

  render() {
    const { t } = this.props;
    return (
      <CardBody>
        <h4 className="mb-3">
          {this.state.isMeetingRunning
            ? "Aktywni użytkownicy:"
            : "Obecnie w tym pokoju nie trwa spotkanie"}
        </h4>
        <button className="btn btn-orange" onClick={this.getMeetingInfo}>
          {t("conference.refresh")}
        </button>
        {this.state.isMeetingRunning && (
          <List>
            
            {this.state.users.map((item) => {
                return <RenderListItem name={item} />
            })}
          </List>
        )}
      </CardBody>
    );
  }
}

export default withTranslation("common")(ActiveUsers);
