import React, { Component } from 'react';
import { Collapse } from 'reactstrap';
import { fetchWrapper } from '~root/_helpers/fetch-wrapper';

export default class TopbarBBBStatus extends Component {
  constructor() {
    super();
    this.state = {
      collapse: false,
      bbbStatus: null,
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    this.checkBBBStatus();
    // Sprawdzaj status co 30 sekund
    this.interval = setInterval(() => {
      this.checkBBBStatus();
    }, 30000);
  }

  componentWillUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  checkBBBStatus = async () => {
    try {
      const status = await fetchWrapper.get(
        process.env.REACT_APP_SERVER_URL + '/roomservice/check-bbb-status'
      );
      this.setState({ 
        bbbStatus: status, 
        loading: false,
        error: null 
      });
    } catch (error) {
      this.setState({ 
        bbbStatus: null, 
        loading: false,
        error: error.message 
      });
    }
  };

  toggle = () => {
    this.setState(prevState => ({ collapse: !prevState.collapse }));
  };

  render() {
    const { collapse, bbbStatus, loading, error } = this.state;

    if (loading) {
      return (
        <div className="topbar__item">
          <div className="topbar__button">
            <span className="topbar__icon-wrap">
              <span className="lnr lnr-sync" style={{ animation: 'spin 1s linear infinite' }} />
            </span>
          </div>
        </div>
      );
    }

    const isOnline = bbbStatus && bbbStatus.online;
    const statusColor = isOnline ? '#4ce1b6' : '#ff4861';
    const statusIcon = isOnline ? 'lnr-checkmark-circle' : 'lnr-cross-circle';
    const statusText = isOnline ? 'BBB Online' : 'BBB Offline';

    return (
      <div className="topbar__item">
        <button 
          className="topbar__button" 
          type="button"
          onClick={this.toggle}
          style={{ position: 'relative' }}
        >
          <span className="topbar__icon-wrap" style={{ position: 'relative' }}>
            <span className="lnr lnr-cloud-sync" style={{ color: statusColor }} />
            {isOnline && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '8px',
                height: '8px',
                backgroundColor: statusColor,
                borderRadius: '50%',
                border: '2px solid #ffffff'
              }} />
            )}
          </span>
        </button>
        {collapse && (
          <button className="topbar__back" type="button" onClick={this.toggle} />
        )}
        <Collapse isOpen={collapse} className="topbar__menu-wrap">
          <div className="topbar__menu">
            <div className="topbar__menu-content" style={{ minWidth: '280px', padding: '15px' }}>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #eeeeee'
                }}>
                  <span className={statusIcon} style={{ 
                    fontSize: '24px', 
                    color: statusColor,
                    marginRight: '10px'
                  }} />
                  <div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      fontSize: '14px',
                      color: statusColor
                    }}>
                      {statusText}
                    </div>
                    {isOnline && bbbStatus.version && (
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Version {bbbStatus.version}
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#fff3cd',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontSize: '12px', color: '#856404' }}>
                      <strong>Error:</strong> {error}
                    </div>
                  </div>
                )}

                {isOnline ? (
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#999' }}>API Version:</span>{' '}
                      <strong>{bbbStatus.apiVersion || 'N/A'}</strong>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#999' }}>Major Version:</span>{' '}
                      <strong>BBB {bbbStatus.majorVersion || 'N/A'}</strong>
                    </div>
                    <div style={{ 
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid #eeeeee'
                    }}>
                      <span style={{ color: '#999' }}>Server:</span>
                      <div style={{ 
                        fontSize: '11px', 
                        wordBreak: 'break-all',
                        marginTop: '5px',
                        color: '#666'
                      }}>
                        {bbbStatus.url}
                      </div>
                    </div>
                    <div style={{ 
                      marginTop: '10px',
                      fontSize: '11px',
                      color: '#999',
                      textAlign: 'center'
                    }}>
                      Auto-refresh: 30s
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    padding: '15px', 
                    backgroundColor: '#fff0f0',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', color: '#d32f2f', marginBottom: '5px' }}>
                      <strong>Server Offline</strong>
                    </div>
                    {bbbStatus && bbbStatus.error && (
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {bbbStatus.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Collapse>
      </div>
    );
  }
}

