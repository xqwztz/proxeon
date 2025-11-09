import React, { useState, useEffect } from 'react';
import { Route, Switch, Redirect, useLocation } from 'react-router-dom';
import Layout from '~root/containers/Layout/index';
import MainWrapper from './MainWrapper';
import { Role } from '~root/_helpers'
import LogIn from '~root/containers/accounts/LogIn/index';
import Register from '~root/containers/accounts/Register/index';
import { accountService } from '~root/_services';
import { PrivateRoute } from '~root/containers/PrivateRoute';
import resetPassw from '~root/containers/accounts/resetPassw/index'
import forgetPassw from '~root/containers/accounts/forgetPassw/index'
import verifyEmail from '~root/containers/accounts/verifyEmail/index';
import { Alert } from '~root/containers/Alert'
import AdminUsers from '~root/containers/admin/index'
import MainPage from '~root/containers/MainPage/index'
import Rooms from '~root/containers/Conference/components/Rooms'
import UserJoin from '~root/containers/Conference/components/UserJoin'
import ChangePassword from '~root/containers/accounts/ChangePassword'
import ActiveUsers from '~root/containers/ActiveUsers'
import AdminReports from '~root/containers/admin/reports'

const wrappedRoutes = () => (
  <div>
    <Layout />
    <div className="container__wrap">
      <Route path="/rooms/:id?" component={Rooms} />
      <Route path="/adminUsers" roles={[Role.Admin]} component={AdminUsers} />
      <Route path="/changePassword" component={ChangePassword} />
      <Route path="/activeUsers" roles={[Role.Admin]} component={ActiveUsers} />
      <Route path="/adminReports" roles={[Role.Admin]} component={AdminReports} />
      <Route exact path="/" component={MainPage} />

    </div>
  </div>
)



const wrappedMainpageUser = () => (
  <div>
    <Layout />
    <div className="container__wrap" style={{ "paddingLeft": "0" }}>
      <Route exact path="/" component={MainPage} />
    </div>
  </div>
)



const Router = ({history}) => {
  const { pathname } = useLocation();
  const [user, setUser] = useState({});

  useEffect(() => {
    const subscription = accountService.user.subscribe(x => setUser(x));
    return subscription.unsubscribe;
  }, []);

  return (
    <MainWrapper>

      <main>
        <Alert />
        <Switch>
          <Redirect from="/:url*(/+)" to={pathname.slice(0, -1)} />
          {user ? <Redirect from="/login" to="/" /> : null}
          {/* {user ? <Redirect from="/register" to="/" /> : null} */}

          <Route path="/login" component={LogIn} />
          {/* <Route path="/register" component={Register} /> */}
          <Route path="/resetPassword" component={resetPassw} />
          <Route path="/verifyEmail" component={verifyEmail} />
          <Route path="/forgetPassword" component={forgetPassw} />
          <PrivateRoute path="/changePassword" component={wrappedRoutes} />
          <PrivateRoute path="/activeUsers" roles={[Role.Admin]} component={wrappedRoutes} />

          <PrivateRoute path="/rooms/:id?" component={wrappedRoutes} />
          <Route path="/join-room/:type/:id" component={UserJoin} />

          <PrivateRoute path="/adminUsers" roles={[Role.Admin]} component={wrappedRoutes} />
          <PrivateRoute path="/adminReports" roles={[Role.Admin]} component={wrappedRoutes} />

          {user?
            <Redirect from="/" to="/rooms"/>
            :
            <Redirect from="/rooms" to="/"/>
          }

          {user && user.role === "User" ?
            <PrivateRoute exact path="/" component={wrappedMainpageUser} />
            :
            <PrivateRoute exact path="/" component={wrappedRoutes} />
          }
          <Redirect from="*" to="/" />

        </Switch>

      </main>
    </MainWrapper>
  )
}

export default Router;
