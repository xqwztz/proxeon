import React, { Component } from 'react'
import { Progress } from 'react-sweet-progress';
import "react-sweet-progress/lib/style.css";

class ProgressBar extends Component {
  render() {
    return (
        <div style={{"marginLeft":this.props.margin, "marginTop":"5px", "marginBottom":"5px"}}>
          {this.props.margin===0?<><h3>{this.props.title}</h3><h5>{this.props.subtitle}</h5></>:<h5>{this.props.title}</h5>}
        <Progress percent={this.props.percent}/>
        </div>
    )
  }
}

export default ProgressBar
