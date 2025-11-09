import React from 'react';
import {
 Table
} from 'reactstrap';
import { withTranslation } from 'react-i18next';

class BorderedTable extends React.Component {
  render() {
    return (
            <Table className="table--bordered" responsive key={"recordings_table"}>
              <thead key={"row_head"}>
                <tr>
                  <th key={"head1"}>{this.props.t('conference.title')}</th>
                  <th key={"head2"}>{this.props.t('conference.date')}</th>
                  <th key={"head3"}>{this.props.t('conference.status')}</th>
                  <th key={"head4"}></th>
                </tr>
              </thead>
              <tbody key={"row_body"}>
                {this.props.data}
              </tbody>
            </Table>

    )
  }
}

export default (withTranslation('common'))(BorderedTable);
