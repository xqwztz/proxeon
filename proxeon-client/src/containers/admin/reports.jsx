import React, { useState, useEffect } from "react";
import { Card, CardBody, Col, Table, Input, FormGroup } from "reactstrap";
import { withTranslation } from "react-i18next";
import { meetingService } from "~root/_services/meeting.service";
import { alertService } from "~root/_services";
import ReportsTable from "./components/dataReportsTable";

const AdminReports = (props) => {
  const [loadRecording, setLoadRecording] = useState(false);
  const [loadMeetings, setLoadMeetings] = useState(false);

  const [recordings, setRecordings] = useState(null);
  const [meetings, setMeetings] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allRecordingsData, setAllRecordingsData] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc"); // "asc" or "desc"

  useEffect(() => {
    getMeetings();
    getRecordings();
  }, []);

  const getRecordings = async () => {
    await meetingService.getAllRecordings().then((res) => {
      if (Array.isArray(res.recordings)) {
        setAllRecordingsData(res.recordings);
        renderRecordings(res.recordings, res.BBB_DOWNLOAD_URL);
      } else if (typeof res === "object" && res.recordings) {
        setAllRecordingsData([res.recordings]);
        renderRecordings([res.recordings], res.BBB_DOWNLOAD_URL);
      } else {
        setRecordings("Niczego nie znaleziono");
      }
      setLoadRecording(true);
    });
  };

  const renderRecordings = (recordingsData, downloadUrl) => {
    if (recordingsData.length === 0) {
      setRecordings("Niczego nie znaleziono");
      return;
    }

    const records = recordingsData.map(function (item, index) {
      return (
        <ReportsTable
          recording={item}
          key={index}
          url={downloadUrl}
        />
      );
    });
    setRecordings(records);
  };

  const sortRecordings = (data, field, direction) => {
    const sorted = [...data].sort((a, b) => {
      let aValue, bValue;

      switch (field) {
        case "name":
          aValue = (a.name || "").toLowerCase();
          bValue = (b.name || "").toLowerCase();
          break;
        case "startTime":
          aValue = parseInt(a.startTime) || 0;
          bValue = parseInt(b.startTime) || 0;
          break;
        case "endTime":
          aValue = parseInt(a.endTime) || 0;
          bValue = parseInt(b.endTime) || 0;
          break;
        case "state":
          aValue = (a.state || "").toLowerCase();
          bValue = (b.state || "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const handleSort = (field) => {
    const newDirection = 
      sortField === field && sortDirection === "asc" ? "desc" : "asc";
    
    setSortField(field);
    setSortDirection(newDirection);

    // Get current filtered data or all data
    const dataToSort = searchQuery.trim() 
      ? allRecordingsData.filter((recording) => {
          const searchLower = searchQuery.toLowerCase();
          const name = (recording.name || "").toLowerCase();
          const meetingID = (recording.meetingID || "").toLowerCase();
          const internalMeetingID = (recording.internalMeetingID || "").toLowerCase();
          
          return name.includes(searchLower) || 
                 meetingID.includes(searchLower) || 
                 internalMeetingID.includes(searchLower);
        })
      : allRecordingsData;

    const sorted = sortRecordings(dataToSort, field, newDirection);
    
    meetingService.getAllRecordings().then((res) => {
      renderRecordings(sorted, res.BBB_DOWNLOAD_URL);
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // If search is empty, show all recordings
      meetingService.getAllRecordings().then((res) => {
        if (Array.isArray(res.recordings)) {
          const dataToRender = sortField 
            ? sortRecordings(res.recordings, sortField, sortDirection)
            : res.recordings;
          renderRecordings(dataToRender, res.BBB_DOWNLOAD_URL);
        }
      });
      return;
    }

    // Filter recordings by name, meetingID, or internalMeetingID
    const filtered = allRecordingsData.filter((recording) => {
      const searchLower = query.toLowerCase();
      const name = (recording.name || "").toLowerCase();
      const meetingID = (recording.meetingID || "").toLowerCase();
      const internalMeetingID = (recording.internalMeetingID || "").toLowerCase();
      
      return name.includes(searchLower) || 
             meetingID.includes(searchLower) || 
             internalMeetingID.includes(searchLower);
    });

    const dataToRender = sortField 
      ? sortRecordings(filtered, sortField, sortDirection)
      : filtered;

    meetingService.getAllRecordings().then((res) => {
      renderRecordings(dataToRender, res.BBB_DOWNLOAD_URL);
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
              <FormGroup style={{ marginBottom: "20px" }}>
                <Input
                  type="text"
                  placeholder="🔍 Szukaj nagrań (nazwa, meetingID, internalMeetingID)..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{
                    padding: "10px",
                    fontSize: "16px",
                    border: "2px solid #ddd",
                    borderRadius: "5px"
                  }}
                />
              </FormGroup>
              {loadRecording && typeof(recordings) !== "string" ? <Table className="table--bordered" responsive>
                <thead>
                  <tr>
                    <th 
                      onClick={() => handleSort("name")} 
                      style={{ cursor: "pointer", userSelect: "none" }}
                      title="Kliknij aby sortować"
                    >
                      {props.t("admin.meeting-name")}
                      {sortField === "name" && (
                        <span style={{ marginLeft: "5px" }}>
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th>{props.t("admin.meeting-id")}</th>
                    <th>{props.t("admin.meeting-internal-id")}</th>
                    <th 
                      onClick={() => handleSort("startTime")} 
                      style={{ cursor: "pointer", userSelect: "none" }}
                      title="Kliknij aby sortować"
                    >
                      {props.t("admin.meeting-createDate")}
                      {sortField === "startTime" && (
                        <span style={{ marginLeft: "5px" }}>
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort("endTime")} 
                      style={{ cursor: "pointer", userSelect: "none" }}
                      title="Kliknij aby sortować"
                    >
                      {props.t("admin.meeting-endTime")}
                      {sortField === "endTime" && (
                        <span style={{ marginLeft: "5px" }}>
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort("state")} 
                      style={{ cursor: "pointer", userSelect: "none" }}
                      title="Kliknij aby sortować"
                    >
                      {props.t("admin.meeting-state")}
                      {sortField === "state" && (
                        <span style={{ marginLeft: "5px" }}>
                          {sortDirection === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </th>
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
