import React, { PureComponent } from 'react';
import { withTranslation } from 'react-i18next';
import { Collapse } from 'reactstrap';
import DownIcon from 'mdi-react/ChevronDownIcon';
import PropTypes from 'prop-types';
import PL from "~img/languages/pl.png"
import GB from "~img/languages/gb.png"

const GbLng = () => (
  <span className="topbar__language-btn-title">
    <img src={GB} alt="gb" />
    <span>EN</span>
  </span>
);

const PlLng = () => (
  <span className="topbar__language-btn-title">
    <img src={PL} alt="pl" />
    <span>PL</span>
  </span>
);


class TopbarLanguage extends PureComponent {
  static propTypes = {
    i18n: PropTypes.shape({ changeLanguage: PropTypes.func }).isRequired,
  };

  constructor(props) {
    super(props);
    let btn
    props.i18n.language==="pl" ? btn=<PlLng/>: btn=<GbLng/>
    this.state = {
      collapse: false,      
      mainButtonContent: btn
    };
  }

  toggle = () => {
    this.setState(prevState => ({ collapse: !prevState.collapse }));
  };

  changeLanguage = (lng) => {
    const { i18n } = this.props;
    i18n.changeLanguage(lng);
    switch (lng) {
      case 'en':
        this.setState({ mainButtonContent: <GbLng />,collapse:false });
        break;
      case 'pl':
        this.setState({ mainButtonContent: <PlLng />,collapse:false });
        break;
      default:
        this.setState({ mainButtonContent: <PlLng />,collapse:false });
        break;
    }
  };

  render() {
    const { mainButtonContent, collapse } = this.state;

    return (
      <div className="topbar__collapse topbar__collapse--language" style={{marginLeft:"20px"}}>
        <button className="topbar__btn" type="button" onClick={this.toggle}>
          {mainButtonContent}
          <DownIcon className="topbar__icon" />
        </button>
        {collapse && <button className="topbar__back" type="button" onClick={this.toggle} />}
        <Collapse
          isOpen={collapse}
          className="topbar__collapse-content topbar__collapse-content--language"
        >
          <button
            className="topbar__language-btn"
            type="button"
            onClick={() => this.changeLanguage('pl')}
          >
            <PlLng />
          </button>
          <button
            className="topbar__language-btn"
            type="button"
            onClick={() => this.changeLanguage('en')}
          >
            <GbLng />
          </button>
        </Collapse>
      </div>
    );
  }
}

export default withTranslation('common')(TopbarLanguage);
