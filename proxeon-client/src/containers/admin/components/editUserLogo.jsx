import React, { Component } from 'react'
import { history } from '~root/_helpers'
import Select from 'react-select';
import { alertService,accountService } from '~root/_services'
import { fetchWrapper } from '~root/_helpers/fetch-wrapper'
import { withTranslation } from 'react-i18next';


let id
class EditUserLogo extends Component {
    constructor(props) {
        super()
        this.state = { selectedOption:null, logos: [], options:[] }
    }

    componentDidMount = () => {
        const url = (this.props.location.pathname).split("/")
        url.pop()

        id = this.props.match.params.id
        // remove token from url to prevent http referer leakage
        history.replace(url.join("/"));

        this.getLogos()
    }

    getLogos = () => {
        const ref=this
        let logos_tab=[]
        let initial
        fetchWrapper.get(process.env.REACT_APP_SERVER_URL + "/logosList", [])
            .then(async (res) => {
                logos_tab=await res.map((item)=>{
                    if(item===ref.props.location.state.logo)
                        initial={value:item, label: <div className="d-flex flex-row justify-content-between"><img alt="logo" style={{"maxHeight":"50px", "width":"auto"}} src={process.env.REACT_APP_SERVER_URL+"/getLogo/"+item}/></div>}
                    return {value:item, label: <div className="d-flex flex-row justify-content-between"><img alt="logo" style={{"maxHeight":"50px", "width":"auto"}} src={process.env.REACT_APP_SERVER_URL+"/getLogo/"+item}/></div>}
                })
                ref.setState({options:logos_tab, selectedOption:initial})
            })
            .catch(err => {
                alertService.error(err)
            })
    }

    handleChange = (selectedOption) => {
        this.setState({ selectedOption:selectedOption });
    }

    handleSave= ()=>{
        try {
            accountService.update(id, {logo:this.state.selectedOption.value}, this.props.i18n.language)
                .then(() => {
                    alertService.success(this.props.t('admin.update-success'), { keepAfterRouteChange: true });
                    if(accountService.userValue.id===id)
                    window.location.reload()
                    else
                    this.props.history.push('/adminUsers')                
                })
                .catch(error => {
                    alertService.error(error);
                });
        }
        catch (err) {
            alertService.error(err);
        }
    }

    render() {
        return (
            <div className="account__card">
                <Select
                    value={this.state.selectedOption}
                    onChange={this.handleChange}
                    options={this.state.options}
                />
                <button className="btn btn-orange" onClick={this.handleSave}>Zapisz</button>
            </div>
        )
    }
}

export default (withTranslation('common'))(EditUserLogo);
