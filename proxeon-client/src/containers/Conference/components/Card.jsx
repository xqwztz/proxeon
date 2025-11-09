import React from 'react';
import { Card, CardBody, Col } from 'reactstrap';

import { accountService, alertService } from '~root/_services'
import { meetingService } from '~root/_services/meeting.service';
import BorderedTable from './Table'

import { withTranslation } from 'react-i18next';

import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_SERVER_URL);





class ConferenceCard extends React.Component {
  constructor() {
    super()
    this.state = { loaded: false, meetingEndUrl: "", moderatorURL: "", attendeeUrl: "", src: "", meetings: [], meetingID: "", playingID:"" }
  }
  createMeeting = () => {
    meetingService.create({ author: accountService.userValue.email, name: "My meeting" })
      .then(response => JSON.parse(response))
      .then(data => {
        this.setState({ loaded: true, meetingEndUrl: data.meetingEndUrl, moderatorURL: data.moderatorUrl, attendeeUrl: data.attendeeUrl, meetingID: data.meetingID })
      })
      .catch(error => {
        console.log(error)
      });
  }
  meetingEnded = (id) => {
    if (id === this.state.meetingID) {
      this.setState({ loaded: false })
    }
  }

  componentWillUnmount=()=>{
    this.props.i18n.off("languageChanged")
  }

  componentDidMount = () => {
    this.props.i18n.on("languageChanged",()=>{this.getMeetings()})

    this.getMeetings()
    let ref = this
    socket.on("end", function (data) {
      ref.meetingEnded(data)
      //socket.close()
    })
  }

  showRecording = (id)=>{
    this.setState({playingID:""})
    this.setState({
      playingID:id
    })
  }

  getMeetings = async () => {
    const states = { "ready": this.props.t("conference.ready"), "encoding": this.props.t("conference.encoding"), "downloaded": this.props.t("conference.downloaded") }
    const ref=this
    await meetingService.getMeetings()
      .then((res) => {
        let rows = res.map((item, index) => {
          const convertedDate=new Date(item.startDate)
          const day=("0"+convertedDate.getDate()).slice(-2)
          const month=("0"+(parseInt(convertedDate.getMonth())+1)).slice(-2)
          const dateToDisplay=day+"-"+month +"-"+convertedDate.getFullYear()+" "+convertedDate.getHours()+":"+convertedDate.getMinutes()
          return (<>
            {
              <tr key={"meeting" + index}>
                <td key={"name"+index}>{item.name}</td>
                <td key={"date"+index}>{dateToDisplay}</td>
                <td key={"status"+index}>{states[item.recordingStatus]}</td>
                <td key={"btnContainer"+index}>
                  {item.recordingStatus==="downloaded" ? <button key={"btn"+index} className="btn btn-orange" onClick={() => this.showRecording(item.meetingID)}>
                    {ref.props.t("conference.recording")}
                    </button>
                  :null}</td>
                </tr>
            }
          </>
          )
        })
        this.setState({ meetings: rows })
      })
      .catch((err) => {
        alertService.error(err)
      })

  }

  preventContextMenu =(e)=>{
    e.preventDefault()
  }

  endMeeting = () => {
    meetingService.endMeeting(this.state.meetingEndUrl).then((res) => {
      if (res === "ok") {
        this.setState({ loaded: false })
        alert(this.props.t("conference.meeting-ended"))
      }
    })
  }

  render() {
    const {t}=this.props
    return (
      <Col md={12} xl={12}>
        <Card>
          <CardBody>
            <div className="card__title">
              {!this.state.loaded ?
                <div>
                  <button className="btn btn-orange" onClick={this.createMeeting}>{t('conference.create-meeting')}</button>
                </div>
                :
                <div>
                  <button className="btn btn-orange" onClick={() => window.open(this.state.moderatorURL)}>{t('conference.admin-link')}</button>
                  <button className="btn btn-orange" onClick={() => window.open(this.state.attendeeUrl)}>{t('conference.user-link')}</button>
                  <button className="btn btn-orange" onClick={this.endMeeting}>{t('conference.end-meeting')}</button>
                </div>
              }

            </div>
            <div>
              <div className="mt-4 mb-4">
                <h4>{t('conference.my-recordings')}:</h4>
              </div>
              <button className="btn btn-orange" onClick={this.getMeetings}>{t('conference.refresh')}</button>
              {this.state.meetings.length > 0 ? <BorderedTable data={this.state.meetings} /> : null}

            </div>
            <div>
              {this.state.playingID!==""?
              <video onContextMenu={this.preventContextMenu} 
              controls autoPlay width="500" src={process.env.REACT_APP_SERVER_URL+"/meetings/streamVideo?id="+this.state.playingID} type="video/mp4">
                {/* <source src={} type="video/mp4"/> */}
              </video>
              :null}
            </div>
          </CardBody>
        </Card>
      </Col>
    )
  }
}

export default (withTranslation('common'))(ConferenceCard);
