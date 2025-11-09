import React, { Component } from 'react'
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap/Modal';
import CheckCircleOutlineIcon from 'mdi-react/CheckCircleOutlineIcon'
import CloseCircleOutlineIcon from 'mdi-react/CloseCircleOutlineIcon'

class Confirm extends Component {
    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onReject}>
                <Modal.Header closeButton>
                    <Modal.Title style={{ "color": "red" }} className="d-flex flex-row align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="mr-4" style={{"minWidth":"40px", "minHeight":"40px"}}>
                            <path fill="red" d="M12 5.177l8.631 15.823h-17.262l8.631-15.823zm0-4.177l-12 22h24l-12-22zm-1 9h2v6h-2v-6zm1 9.75c-.689 0-1.25-.56-1.25-1.25s.561-1.25 1.25-1.25 1.25.56 1.25 1.25-.561 1.25-1.25 1.25z" />
                        </svg>
                        <this.props.question/>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <this.props.description/>
                </Modal.Body>
                <Modal.Footer>
                    <div className="d-flex flex-column justify-content-around align-items-center">
                        <div className="d-flex flex-row justify-content-around">
                            <button className="btn btn-primary mb-0" onClick={this.props.onConfirm}>
                                <CheckCircleOutlineIcon style={{"marginTop":"-2px"}}/>
                                <span>TAK</span>
                            </button>
                            <button className="btn btn-danger mb-0" onClick={this.props.onReject}>
                                <CloseCircleOutlineIcon style={{"marginTop":"-2px"}}/>
                                <span>NIE</span>
                            </button>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>
        )
    }
}
Confirm.propTypes = {
    question: PropTypes.func.isRequired,
    description: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired,
    show: PropTypes.bool.isRequired
}

export default Confirm

