import React, { Component, Fragment} from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import '~root/scss/app.scss';
import Router from './Router';
import store from './store';
import ScrollToTop from './ScrollToTop';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { config as i18nextConfig } from '~root/translations';
import {history} from '~root/_helpers/history'
import Favicon from 'react-favicon';
import favicon_hxspace from '~public/favicon_hxspace.ico'
import favicon_proxeon from '~public/favicon_proxeon.ico'
import favicon_onbox from '~public/favicon_onbox.ico'

import { changeColorToBlue, changeColorToGreen, changeColorToOrange } from '~root/redux/actions/colorActions';

i18n.init(i18nextConfig);

class App extends Component {

  constructor() {
    super();
    this.state = {
      loading: true,
      loaded: false,
    };

  }

  componentDidMount() {
      switch(window.location.hostname){
        case 'ropibrwarszawa.hxspace.pl':{
          document.title = "ROPIBR Warszawa"
          store.dispatch(changeColorToBlue())
          break;
        }
        case 'proxeon.pl':{
          store.dispatch(changeColorToGreen())
          document.title= "Proxeon"
          break;
        }
        case 'hxspace.pl':{
          store.dispatch(changeColorToBlue())
          document.title= "Hxspace"
          break;
        }
        case '2meet.onbox.pl':{
          store.dispatch(changeColorToOrange())
          document.title= "Onbox meeting"
          break;
        }
        default:{
          document.title = process.env.REACT_APP_DOMAIN
          break;
        }
      }

      this.setState({ loading: false });
      setTimeout(() => this.setState({ loaded: true }), 500);
  }
  render() {
    const { loaded, loading } = this.state;
    let selected_favicon
    switch(window.location.hostname){
      case 'ropibrwarszawa.hxspace.pl':{
        selected_favicon=favicon_hxspace
        break;
      }
      case 'proxeon.pl':{
        selected_favicon=favicon_proxeon
        break;
      }
      case 'hxspace.pl':{
        selected_favicon=favicon_hxspace
        break;
      }
      case '2meet.onbox.pl':{
        selected_favicon=favicon_onbox
        break;
      }
      default:{
        selected_favicon=favicon_hxspace
        break;
      }
    }

    return (
      <Provider store={store}>
      <Favicon 
      url={selected_favicon} 
      />
        <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          <ScrollToTop>
            <Fragment>
              {!loaded
                && (
                  <div className={`load${loading ? '' : ' loaded'}`}>
                    <div className="load__icon-wrap">
                      <svg className="load__icon">
                        <path fill="#87CE32" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                      </svg>
                    </div>
                  </div>
                )
              }
              <div>
                <Router history={history}/>
                <div id="modal-container" style={{
                  width:'100%',
                  height:"100%",
                  position:"absolute",
                  top:0,
                  left:0,
                  zIndex:-1
                }}></div>
              </div>
            </Fragment>
          </ScrollToTop>
          </I18nextProvider>
        </BrowserRouter>
      </Provider>
    );
  }
}

export default App;
