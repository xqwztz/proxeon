import React, { useState, useEffect } from "react";
import { Card, CardBody, Col, Table } from "reactstrap";
import { withTranslation } from "react-i18next";
import { meetingService } from "~root/_services/meeting.service";
import { alertService } from "~root/_services";
import ReportsTable from "./components/dataReportsTable";

const AdminReports = (props) => {
  const [loadRecording, setLoadRecording] = useState(false);
  const [loadMeetings, setLoadMeetings] = useState(false);

  const [recordings, setRecordings] = useState(null);
  const [meetings, setMeetings] = useState(null);

  useEffect(() => {
    getMeetings();
    getRecordings();
  }, []);

  const getRecordings = async () => {
    await meetingService.getAllRecordings().then((res) => {
      let records;

      if (Array.isArray(res.recordings)) {
        records = res.recordings.map(function (item, index) {
          return (
            <ReportsTable
              recording={item}
              key={index}
              url={res.BBB_DOWNLOAD_URL}
            />
          );
        });
      } else if (typeof res === "object") {
        records = <ReportsTable recording={res.recordings} />;
      } else {
        records = "Niczego nie znaleziono";
      }
      setRecordings(records);
      setLoadRecording(true);
    });
  };

  const getMeetings = async () => {
    await meetingService
      .getAllMeetings()
      .then((res) => {
        let meetings;
        if (Array.isArray(res)) {
          meetings = res.map(function (item, index) {
            return <ReportsTable meeting={item} />;
          });
        } else if (typeof res === "object") {
          meetings = <ReportsTable meeting={res} />;
        } else {
          meetings = "Niczego nie znaleziono";
        }
        setMeetings(meetings);
        setLoadMeetings(true);
      })
      .catch((err) => {
        alertService.error(err);
      });
  };

  return (
    <div>
      <Col sm={12}>
        <Card>
          <CardBody>
            <>
              <div className="d-flex flex-row space-around">
                <h1 style={{ paddingBottom: "20px" }}>
                  {props.t("admin.current-meetings")}
                </h1>
              </div>
              {loadMeetings && typeof(meetings) !== "string" ?
              <Table className="table--bordered" responsive>
                <thead>
                  <tr>
                    <th>{props.t("admin.meeting-name")}</th>
                    <th>{props.t("admin.meeting-id")}</th>
                    <th>{props.t("admin.meeting-internal-id")}</th>
                    <th>{props.t("admin.meeting-createDate")}</th>
                    <th>{props.t("admin.meeting-info")}</th>
                  </tr>
                </thead>
                    <tbody>{meetings}</tbody>
              </Table>
              :
              typeof(meetings) === "string" && loadMeetings ? <div>{meetings}</div> : <div>Trwa ładowanie...</div>
              }
            </>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <>
              <div className="d-flex flex-row space-around">
                <h1 style={{ paddingBottom: "20px" }}>
                  {props.t("admin.recorded-meetings")}
                </h1>
              </div>
              {loadRecording && typeof(recordings) !== "string" ? <Table className="table--bordered" responsive>
                <thead>
                  <tr>
                    <th>{props.t("admin.meeting-name")}</th>
                    <th>{props.t("admin.meeting-id")}</th>
                    <th>{props.t("admin.meeting-internal-id")}</th>
                    <th>{props.t("admin.meeting-createDate")}</th>
                    <th>{props.t("admin.meeting-endTime")}</th>
                    <th>{props.t("admin.meeting-state")}</th>
                    <th>{props.t("admin.meeting-info")}</th>
                  </tr>
                </thead>
                <tbody>{recordings}</tbody>

              </Table>
              :
              typeof(recordings) === "string" && loadRecording ? <div>{recordings}</div> : <div>Trwa ładowanie...</div>
              }
            </>
          </CardBody>
        </Card>
      </Col>
    </div>
  );
};
export default withTranslation("common")(AdminReports);
