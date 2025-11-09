import React, { Component } from 'react'
import DataTable from './components/dataTable'
import { accountService, alertService } from '~root/_services'
import { Button } from 'reactstrap'
import { Link } from 'react-router-dom'
import CloseCircleOutlineIcon from 'mdi-react/CloseCircleOutlineIcon';
import AccountEditOutlineIcon from 'mdi-react/AccountEditOutlineIcon';
import EditUser from './components/editUser'
import EditUserLogo from './components/editUserLogo'
import NewUser from './components/newUser'
import { Route, Switch, Redirect } from 'react-router-dom';
import { withTranslation } from 'react-i18next';

class AdminUsers extends Component {
    constructor(props) {
        super(props)
        this.state = { users: [], usersReady: [], mounted: false, prevState: props.location.pathname, loaded: true }
    }

    componentDidMount = async () => {
        this.setState({ users: await accountService.getAll(this.props.i18n.language), mounted: true })
        this.getUsers()
        this.props.i18n.on("languageChanged",()=>{this.getUsers()})
    }
    componentWillUnmount=()=>{
        this.props.i18n.off("languageChanged")

    }
    UNSAFE_componentWillUpdate = async() => {
        if (this.state.prevState !== this.props.location.pathname) {
            this.setState({ users: await accountService.getAll(this.props.i18n.language), mounted: true })
            this.getUsers()
            this.setState({ prevState: this.props.location.pathname })
        }
    }

    deleteUser = (id) => {
        const sure=window.confirm(this.props.t('conference.confirm'))
        if(sure){
        if (accountService.userValue.id === id){
            alertService.error(this.props.t('admin.delete-own-account-err'))
            return
        }
        this.setState({
            users: (this.state.users.map(x => {
                if (x.id === id) { x.isDeleting = true; }
                return x;
            }))
        });
        accountService.delete(id).then(() => {
            this.setState({ users: this.state.users.filter(x => x.id !== id) });
            this.getUsers()
        });
        this.getUsers()
        }
    }

    getUsers = () => {
        let user = accountService.userValue
        let ref = this
        let userComponents = this.state.users.map(function (item, index) {
            return (
                <tr key={"user" + index}>
                    <td>{item.email}</td>
                    <td>{item.role}</td>
                    <td><Link to={`/adminUsers/edit/` + item.id}><Button style={{ "padding": "5px 15px" }} color="primary">
                        <AccountEditOutlineIcon />{ref.props.t('admin.edit')}</Button></Link></td>

                    <td><Link to={{pathname:`/adminUsers/editLogo/` + item.id, state:{logo:item.logo}}}><Button style={{ "padding": "5px 15px" }} color="primary">
                        <AccountEditOutlineIcon />Zmień logo</Button></Link></td>

                    <td><Button style={{ "padding": "5px 15px" }} className="icon" color="danger" disabled={item.isDeleting} onClick={() => {
                        ref.deleteUser(item.id)
                        }}><CloseCircleOutlineIcon />
                        {user.isDeleting
                            ? <span className="spinner-border spinner-border-sm"></span>
                            : ref.props.t("admin.delete")
                        }
                        </Button></td>

                </tr>
            )
        })
        this.setState({ usersReady: userComponents })
        return true;

    }
    render() {
        return (
            <Switch >
                <Route exact path={'/adminUsers'} component={() => <DataTable data={this.state.usersReady} history={this.props.history}/>}/>
                <Route exact path={`/adminUsers/edit`}>
                    <Redirect to="/adminUsers" />
                </Route>
                <Route exact path={`/adminUsers/editLogo`}>
                    <Redirect to="/adminUsers" />
                </Route>
                <Route exact path={`/adminUsers/edit/:id`} component={EditUser} />
                <Route exact path={`/adminUsers/editLogo/:id`} component={EditUserLogo} />
                <Route exact path={`/adminUsers/newUser`} component={NewUser} />

            </Switch>
        )
    }
}

export default (withTranslation('common'))(AdminUsers)
