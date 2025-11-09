import React, { Component } from "react";
import { roomService } from "~root/_services/room.service";
import { accountService } from "~root/_services/account.service";
import { alertService } from "~root/_services/alert.service";
import { withTranslation } from "react-i18next";
import { changeColorToOrange } from '~root/redux/actions/colorActions';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import io from "socket.io-client";

const socket = io(process.env.REACT_APP_SERVER_URL);

class UserJoin extends Component {
  constructor(props) {
    super();
    this.state = {
      nick: "",
      roomName: "",
      waiting: false,
      clicked: false,
      with_code: false,
      mounted: false,
      code: "",
      clicked_code: false,
      logo: "",
      logoState: false
    };
  }

  componentDidMount = () => {
    const ref = this;
    const { dispatch } = this.props;
    roomService
      .checkForCode(this.props.match.params.id)
      .then((res) => {
        res.code
          ? ref.setState({ with_code: true })
          : ref.setState({ with_code: false });

        if(res.color==="orange")
        dispatch(changeColorToOrange())

        ref.setState({ mounted: true, roomName: res.name });
        ref.setState({ logoState: true, logo: res.user_id });

        try{
          roomService.getLogoFromUserId(this.state.logo).then((res) => {
            try{              
              ref.setState({ logoState: true, logo: process.env.REACT_APP_SERVER_URL+'/getLogo/'+res.name });
            }catch{
              ref.setState({ logoState: true, logo: 'https://hxspace.pl/getLogo/logo-hxs.png' });
            }
          });
        }catch(error){
          console.log(error);
        }

      })
      .catch((err) => {
        alertService.error(err);
      });
  };

  handleNickChange = (e) => {
    this.setState({ nick: e.target.value });
  };

  validateCode = () => {
    this.setState({ clicked_code: true });
    const ref = this;
    roomService
      .validateCode(this.state.code, this.props.match.params.id)
      .then((res) => {
        if (res === true) ref.setState({ with_code: false });
        else {
          alertService.error(ref.props.t("conference.wrong-code"));
          ref.setState({ clicked_code: false, code: "" });
        }
      });
  };

  getLink = () => {
    if (this.state.nick === "") {
      alertService.error(this.props.t("conference.nick-required"));
      return;
    }

    const user = accountService.userValue;
    let user_id = undefined;
    if (user) user_id = accountService.userValue.id;

    if (!this.state.clicked) {
      this.setState({ clicked: true });

      roomService
        .getLink({
          type: this.props.match.params.type,
          roomID: this.props.match.params.id,
          userID: user_id,
          login: this.state.nick,
          code: this.state.code,
        })
        .then((response) => {
          window.open(response, "_self");
        })
        .catch((err) => {
          if (err === "wait") {
            const ref = this;
            this.setState({ waiting: true });
            socket.on("modEntered", function () {
              ref.setState({ waiting: false, clicked: false });
              ref.getLink();
            });
          } else if (err === "busy") {
            alertService.error(
              "Serwer jest aktualnie zajęty, spróbuj ponownie za chwilę",
              { autoClose: false }
            );
            this.setState({ clicked: false });
          } else {
            this.setState({ clicked: false });
            alertService.error(err);
          }
        });
    }
  };
  render() {
    const { t } = this.props;
    return (
      <>
        {this.state.mounted ? (
          <div className="limiter">
            <div className="container-login100">
              <div className="wrap-login100 p-t-85 p-b-20">
              <span className="login100-form-title p-b-70">
                  {this.state.roomName}
              </span>
              {!this.state.with_code ? (
                <>
                  {!this.state.waiting ? (
                    <>
                    {
                    <span className="login100-form-avatar">
                       <img src={this.state.logo} alt="Logo"/> 
                    </span>
                    }
                    <div className="wrap-input100 validate-input m-t-85 m-b-35" data-validate = "Wpisz nazwisko i imię">
                      <input 
                        className="input100" 
                        type="text" onChange={this.handleNickChange} 
                        value={this.state.nick} 
                        placeholder={t("conference.name-surname")}
                      />
                      
                    </div>
                    <div className="container-login100-form-btn">
                      <button
                          className="login100-form-btn"
                          onClick={this.getLink}
                          disabled={this.state.clicked}
                        >
                          {t("conference.join")}
                      </button>
                    </div>
                    </>
                  ) : (
                    <p>{t("conference.waiting-for-admin")}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="wrap-input100 validate-input m-t-85 m-b-35" data-validate = "Wpisz kod">
                    <input className="input100" 
                    type="text" 
                    maxLength={6} 
                    onChange={(e) => this.setState({ code: e.target.value })} 
                    value={this.state.code} 
                    placeholder={t("conference.insert-code-placeholder")}
                    />
                    
                  </div>
                  <div className="container-login100-form-btn">
                    <button
                      className="login100-form-btn"
                      onClick={this.validateCode}
                      disabled={this.state.clicked_code}
                    >
                      {t("conference.join")}
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }
}

export default withRouter(connect(state => ({
  sidebar: state.sidebar,
}))(withTranslation("common")(UserJoin)));
