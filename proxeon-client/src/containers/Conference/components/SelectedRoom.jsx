import React, { Component } from 'react'
import { Col, Card, CardBody } from 'reactstrap'
import Form from 'react-bootstrap/Form'
import { withTranslation } from 'react-i18next'
import {withRouter} from 'react-router-dom'

class SelectedRoom extends Component {
    render() {
        const { t } = this.props
        return (
            <Col sm={12}>
                <Card>
                    <CardBody>
                        <div className="big-room-card">
                            <h1 style={{ "overflowWrap": "normal" }}>{this.props.room.name}</h1>
                        </div>
                        <Form.Label>{this.props.t('conference.user-link')}: </Form.Label>
                        <div className="d-flex flex-row align-items-center flex-wrap mb-2">
                        
                            <Form.Control ref={(input) => this.input = input} className="col-4" style={{ "marginRight": "10px" }} type="text" disabled={true}
                                value={`${window.location.origin}/join-room/usr/${this.props.room.user_join_id}`} />

                            <button className="btn btn-orange" style={{ "margin": "0px" }} onClick={() => {
                                const link = window.location.origin + "/join-room/usr/" + this.props.room.user_join_id
                                navigator.clipboard.writeText(link)

                            }}>{t('roomform.copy')}</button>

                        </div>
                        <Form.Label>{this.props.t('conference.mod-link')}: </Form.Label>
                        <div className="d-flex flex-row align-items-center flex-wrap mb-2">
                        
                            <Form.Control ref={(input) => this.input = input} className="col-4" style={{ "marginRight": "10px" }} type="text" disabled={true}
                                value={`${window.location.origin}/join-room/mod/${this.props.room.mod_join_id}`} />

                            <button className="btn btn-orange" style={{ "margin": "0px" }} onClick={() => {
                                const link = window.location.origin + "/join-room/mod/" + this.props.room.mod_join_id
                                navigator.clipboard.writeText(link)

                            }}>{t('roomform.copy')}</button>

                        </div>
                        <button className="btn btn-orange btn-after-break" disabled={this.props.disabled} onClick={() => {
                                if (!this.props.disabled)
                                    this.props.startJoinMeeting()
                                else
                                    return false
                            }} style={{ "fontSize": "22px" }}>
                                <>
                                    {this.props.room.meetingID === null ?
                                        t('roomform.start')
                                        :
                                        t('roomform.join')
                                    }
                                </>
                            </button>
                    </CardBody>
                </Card>
            </Col>
        )
    }
}

export default withRouter((withTranslation('common'))(SelectedRoom))
