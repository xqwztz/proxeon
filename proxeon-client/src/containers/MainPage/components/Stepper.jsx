import React, { Component } from 'react'
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import StepContent from '@material-ui/core/StepContent';
import { withTranslation } from 'react-i18next';


const styles = theme => ({
  root: {
    width: '100%',
  },
  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  actionsContainer: {
    marginBottom: theme.spacing(2),
  },
  resetContainer: {
    padding: theme.spacing(3),
  },
})

class Steps extends Component {
  constructor() {
    super()
    this.state = { steps: [] }
  }

  renderSteps = () => {
    let allSteps = []

    for (let i = 0; i < 4; i++) {
      let substeps = []
      for (let j = 0; j < 4; j++) {
        substeps.push(<Step key={"substep" + i + "_" + j}><StepLabel>{this.props.t('mainpage.step') + (j + 1)}</StepLabel></Step>)
      }
      allSteps.push(
        <Step key={"step" + (i + 1)}>
          <StepLabel>{this.props.t('mainpage.step') + (i + 1)}</StepLabel>
          <StepContent>
            {i === 2 ?
              <Stepper activeStep={1} orientation="vertical">{substeps}</Stepper>
              :
              <Stepper orientation="vertical">{substeps}</Stepper>
            }
          </StepContent>
        </Step>
      )
    }
    this.setState({ steps: allSteps })
  }

  componentDidMount = () => {
    this.renderSteps()
    this.props.i18n.on("languageChanged",()=>{this.renderSteps()})
  }

  componentWillUnmount=()=>{
    this.props.i18n.off("languageChanged")
  }

  render() {
    return (
      <div className={styles.root}>
        <Stepper activeStep={2} orientation="vertical">
          {this.state.steps}
        </Stepper>
      </div>
    )
  }
}

export default (withTranslation('common'))(Steps)
