import React from 'react';
import {render} from 'react-dom';
import App from './containers/App/App';
import {accountService} from './_services'
import HttpsRedirect from 'react-https-redirect';

accountService.refreshToken().finally(startApp);

function startApp(){
  render(
    <HttpsRedirect>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </HttpsRedirect>,
      document.getElementById('root')
  )
}


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
