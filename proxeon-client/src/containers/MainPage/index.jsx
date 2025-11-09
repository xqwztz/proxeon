import React, { Component } from 'react'
import { Col, Card, CardBody, Row } from 'reactstrap'
import ProgressBar from './components/ProgressBar'
import Steps from './components/Stepper'

class MainPage extends Component {
    constructor(props) {
        super(props)
        this.state = { classCompany: "box hidden", classProducts:"box hidden",classClients:"box hidden",classSale:"box hidden",classTests:"box hidden" }
    }
    handleClickCompany = () => {
        this.state.classCompany === "box" ? this.setState({ classCompany: "box hidden" }) : this.setState({ classCompany: "box" })
    }
    handleClickProducts = () => {
        this.state.classProducts === "box" ? this.setState({ classProducts: "box hidden" }) : this.setState({ classProducts: "box" })
    }
    handleClickClients = ()=>{
        this.state.classClients === "box" ? this.setState({ classClients: "box hidden" }) : this.setState({ classClients: "box" })
    }
    handleClickSale = () =>{
        this.state.classSale === "box" ? this.setState({ classSale: "box hidden" }) : this.setState({ classSale: "box" })
    }
    handleClickTests = () =>{
        this.state.classTests === "box" ? this.setState({ classTests: "box hidden" }) : this.setState({ classTests: "box" })
    }
    render() {
        const companyComponents = [
            <ProgressBar key={"progress_1_1"} title={"Dostęp do narzędzi pracy"} percent={100} margin={20} />,
            <ProgressBar key={"progress_1_2"} title={"Zasady komunikacji"} percent={100} margin={20} />,
            <ProgressBar key={"progress_1_3"} title={"Zarządzanie zadaniami"} percent={100} margin={20} />,
            <ProgressBar key={"progress_1_4"} title={"Wizja"} percent={53} margin={20} />,
            <ProgressBar key={"progress_1_5"} title={"Misja"} percent={0} margin={20} />,
            <ProgressBar key={"progress_1_6"} title={"Struktura organizacyjna"} percent={0} margin={20} />,
            <ProgressBar key={"progress_1_7"} title={"Zakres zadań/odpowiedzialności członków zespołu"} percent={0} margin={20} />,
            <ProgressBar key={"progress_1_8"} title={"Przedstawienie członków zespołu"} percent={0} margin={20} />,
            <ProgressBar key={"progress_1_9"} title={"Struktura plików"} percent={0} margin={20} />
        ]
        const productsComponents = [
            <ProgressBar key={"progress_2_1"} title={"Katalog produktów"} percent={100} margin={20} />,
            <ProgressBar key={"progress_2_2"} title={"Value Ledder"} percent={82} margin={20} />,
            <ProgressBar key={"progress_2_3"} title={"Oferta"} percent={0} margin={20} />,
            <ProgressBar key={"progress_2_4"} title={"Cennik"} percent={0} margin={20} />,
            <ProgressBar key={"progress_2_5"} title={"Korespondecja z Klientem"} percent={0} margin={20} />,
            <ProgressBar key={"progress_2_6"} title={"Polityka cenowa"} percent={0} margin={20} />,
        ]
        const clientsComponents=[
            <ProgressBar key={"progress_3_1"} title={"Segmentacja"} percent={100} margin={20} />,
            <ProgressBar key={"progress_3_2"} title={"Persony"} percent={100} margin={20} />,
            <ProgressBar key={"progress_3_3"} title={"Struktura klientów"} percent={100} margin={20} />,
            <ProgressBar key={"progress_3_4"} title={"CRM i sposoby zapisywania danych"} percent={100} margin={20} />,
            <ProgressBar key={"progress_3_5"} title={"Budowanie koszyka klientów"} percent={100} margin={20} />,
        ]
        const saleComponents=[
            <ProgressBar key={"progress_4_1"} title={"Otwieranie"} percent={100} margin={20} />,
            <ProgressBar key={"progress_4_2"} title={"Zamykanie"} percent={100} margin={20} />,
            <ProgressBar key={"progress_4_3"} title={"Pytania"} percent={100} margin={20} />,
            <ProgressBar key={"progress_4_4"} title={"Klaryfikacja"} percent={43} margin={20} />,
            <ProgressBar key={"progress_4_5"} title={"Parafraza"} percent={0} margin={20} />,
            <ProgressBar key={"progress_4_6"} title={"Cold calle"} percent={0} margin={20} />,
        ]

        return (
            <Col md={12} lg={12} xl={12}>
                <Row>
                    <Col md={12} lg={6} xl={6}>
                        <Card>
                            <CardBody>
                                <div onClick={this.handleClickCompany} style={{ "cursor": "pointer", "margin":"15px 0 15px 0" }}>
                                    <ProgressBar title={"Firma"} percent={73} margin={0} />
                                    <div className={this.state.classCompany}>{companyComponents}</div>
                                </div>
                                <div onClick={this.handleClickProducts} style={{ "cursor": "pointer", "margin":"15px 0 15px 0" }}>
                                    <ProgressBar title={"Produkty"} percent={21} margin={0} />
                                    <div className={this.state.classProducts}>{productsComponents}</div>
                                </div>
                                <div onClick={this.handleClickClients} style={{ "cursor": "pointer", "margin":"15px 0 15px 0" }}>
                                    <ProgressBar title={"Klienci"} percent={100} margin={0} />
                                    <div className={this.state.classClients}>{clientsComponents}</div>
                                </div>
                                <div onClick={this.handleClickSale} style={{ "cursor": "pointer", "margin":"15px 0 15px 0" }}>
                                    <ProgressBar title={"Sprzedaż"} subtitle={"(kompleksowy warsztat sprzedażowy)"} percent={84} margin={0} />
                                    <div className={this.state.classSale}>{saleComponents}</div>
                                </div>
                                {/* <div onClick={this.handleClickTests} style={{ "cursor": "pointer" }}>
                                    <ProgressBar title={"Testy"} percent={100} margin={0} />
                                    <div className={this.state.classTests}>{testsComponents}</div>
                                </div> */}

                            </CardBody>

                        </Card>
                    </Col>
                    <Col md={12} lg={6} xl={6}>
                        <Card>
                            <CardBody>

                                <Steps />

                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Col>
        )
    }
}

export default MainPage
