import React, { Component, Fragment } from "react";
import { Row, Col, Card, CardBody } from "reactstrap";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import AccountCircleIcon from "@material-ui/icons/AccountCircle";
import {accountService, alertService} from '~root/_services'

const RenderListItem = ({ name, color }) =>{
  return (
    <ListItem> 
      <ListItemIcon style={{alignItems:"center"}}>
      <ColoredCircle color={color}/>
        <AccountCircleIcon />
      </ListItemIcon>
      <ListItemText primary={name} />
    </ListItem>
  );
}

const ColoredCircle = ({ color }) => {

    const styles = { backgroundColor: color };
  
    return color ? (
      <Fragment>
        <span className="colored-circle" style={styles} />
      </Fragment>
    ) : null;
  };

class ActiveUsers extends Component {
  constructor() {
    super();
    this.state = { users: [], gotData:false };
  }
  componentDidMount = () => {
    this.getActiveUsers();
  };

  getActiveUsers = () => {
      accountService.getActiveUsers()
      .then(res=>{
        this.setState({users:res, gotData:true})
      })
      .catch(err=>{
        this.setState({gotData:true})

          alertService.error(err)
      })
  }

  render() {
    return (
      <div className="container">
        <Row style={{ height: "100%" }}>
          <Col>
            <Card>
              <CardBody>
                <h3>Aktywni użytkownicy:</h3>
                <List>
                  {this.state.users.map((item, index) => {
                    return <RenderListItem name={item.email} color="green" key={"user"+index}/>;
                  })}
                </List>
              </CardBody>
            </Card>
          </Col>
        </Row>
        {!this.state.gotData
                && (
                  <div className={`load${this.state.gotData ? '' : ' loaded'}`} style={{width:'100vw', height:"100vh", position:"absolute", top:0, left:0}}>
                    <div className="load__icon-wrap">
                      <svg className="load__icon">
                        <path fill="#87CE32" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                      </svg>
                    </div>
                  </div>
                )
              }
      </div>
    );
  }
}

export default ActiveUsers;
