import React from 'react';
import { withTranslation } from 'react-i18next';

const dataReportsTable = (props) => {

    const getRealTime = (meetingsTime) => {
        const convertedDate=new Date(meetingsTime)
        const day=("0"+convertedDate.getDate()).slice(-2)
        const month=("0"+(parseInt(convertedDate.getMonth())+1)).slice(-2)
        const dateToDisplay=day+"-"+month +"-"+convertedDate.getFullYear()+" "+convertedDate.getHours()+":"+convertedDate.getMinutes()
        return dateToDisplay;
    }


    if(props.recording!=undefined){
        let dateToDisplay = getRealTime(props.recording.startTime);
        let endTime =  getRealTime(props.recording.endTime);
        
        // Use recordID instead of internalMeetingID for MP4 URL
        let mp4Url = props.url + props.recording.recordID + "/" + props.recording.recordID + ".mp4";
        
        // Check if MP4 format is available (BBB 3.0 with MP4 enabled)
        let hasMp4 = false;
        if (props.recording.playback && props.recording.playback.format) {
            const formats = Array.isArray(props.recording.playback.format) 
                ? props.recording.playback.format 
                : [props.recording.playback.format];
            hasMp4 = formats.some(f => f.type === 'video' || f.type === 'mp4');
        }
        
        if(props.recording.meetingID==undefined){
            return (
                <>
                </>
            );
        }
        return (
                <tr>
                    <td style={{"maxWidth": "350px"}}>{props.recording.name}</td>
                    <td>{props.recording.meetingID}</td>
                    <td>{props.recording.internalMeetingID}</td>
                    <td>{dateToDisplay}</td>
                    <td>{endTime}</td>
                    <td>{props.recording.state}</td>
                    <td>
                        <a href={props.recording.playback.format.url} className="btn btn-orange" target="_blank" rel="noopener noreferrer">
                            Zobacz nagranie
                        </a>
                        <br/>
                        {hasMp4 ? (
                            <a href={mp4Url} className="btn btn-orange" target="_blank" rel="noopener noreferrer">
                                Zobacz mp4
                            </a>
                        ) : (
                            <span className="text-muted" style={{fontSize: '12px'}}>
                                (MP4 niedostępny)
                            </span>
                        )}
                    </td>
                </tr>
        )
    }
    if(props.meeting!=undefined){
        let dateToDisplay = getRealTime(props.meeting.createTime);
        return (
            <tr>
                <td>{props.meeting.meetingName}</td>
                <td>{props.meeting.meetingID}</td>
                <td>{props.meeting.internalMeetingID}</td>
                <td>{dateToDisplay}</td>
                <td>{props.t('admin.participantCount')}: {props.meeting.participantCount}<br/>
                    {props.t('admin.listenersCount')}: {props.meeting.listenerCount}<br/>
                    {props.t('admin.videoCount')}: {props.meeting.videoCount}
                </td>
            </tr>
        )
    }
    return (
        "Niczego nie znaleziono"
    )
}

export default (withTranslation('common'))(dataReportsTable);