import React from 'react';
import {
    Card, CardBody, Col, Table
} from 'reactstrap';
import AccountPlusOutlineIcon from 'mdi-react/AccountPlusOutlineIcon';
import { withTranslation } from 'react-i18next';
import { alertService } from '~root/_services/alert.service'
import Form from 'react-bootstrap/Form'
import { fetchWrapper } from '~root/_helpers/fetch-wrapper';


class DataTable extends React.Component {
    newUser = () => {
        this.props.history.push("/adminUsers/newUser")
    }
    handleFileInputChange = (e) => {
        if (e.target.files) {
            
            if (e.target.files[0].type !== "image/png") {
                alertService.error(this.props.t("admin.select-png"))
                return;
            }
            else if (e.target.files[0].size / 1024 / 1024 >= 10) {
                alertService.error(this.props.t("admin.too-big")+10+"MB")
                return;
            }

            this.uploadFile(e.target.files[0])
            e.target.value=""
        }
    }

    uploadFile = (file) => {
        fetchWrapper.postFile(process.env.REACT_APP_SERVER_URL + "/upload", file)
            .then(status => {
                if (status === 200)
                    alertService.success("OK")
            })
            .catch(err => {
                alertService.error(err)
            })
    }

    render() {
        const { t } = this.props
        return (
            <Col sm={12}>
                <Card>
                    <CardBody>
                        <>
                            <div className="d-flex flex-row space-around">
                                <button style={{ "padding": "5px 15px" }} className="icon btn btn-orange" onClick={this.newUser}>
                                    <AccountPlusOutlineIcon />{t('admin.new-user')}</button>

                                <Form onChange={this.handleFileInputChange} className="mb-2">
                                    <Form.File custom>
                                        <Form.File.Input />
                                        <Form.File.Label data-browse={this.props.t("admin.select-file")}>
                                        {t("admin.select-logo")}
                                        </Form.File.Label>
                                    </Form.File>
                                </Form>
                            </div>
                            <Table className="table--bordered" responsive>
                                <thead>
                                    <tr>
                                        <th>{t('admin.user-email')}</th>
                                        <th>{t('admin.user-role')}</th>
                                        <th></th>
                                        <th></th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.props.data}
                                </tbody>
                            </Table>
                        </>
                    </CardBody>
                </Card>
            </Col>
        )
    }
}
export default (withTranslation('common'))(DataTable);
