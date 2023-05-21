import { AnalyticsType, ZepetoAnalyticsComponent } from 'ZEPETO.Analytics';
import { GameObject, Transform, WaitForSeconds } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import * as UnityEngine from "UnityEngine"
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Users, ZepetoWorldHelper, ZepetoWorldMultiplay } from 'ZEPETO.World';
import { NewInputFixedUpdate } from 'UnityEngine.PlayerLoop.FixedUpdate';
import { Room } from 'ZEPETO.Multiplay';

export default class ZepetoAnalytics extends ZepetoScriptBehaviour {

    /* Analytics Properties */
    private analytics : ZepetoAnalyticsComponent;

    /* Default Properties */
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;

    Start() {
        this.analytics = this.gameObject.GetComponent<ZepetoAnalyticsComponent>();
        // 모듈화 작업
        if(!this.multiplay)
        this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;
        }
        this.GoogleAnalytics_SendLogEvent();
    }

    public GoogleAnalytics_SendLogEvent(){
        this.StartCoroutine(this.Coroutine_GoogleAnalytics_SendLogEvent());
    }

    *Coroutine_GoogleAnalytics_SendLogEvent() {
        const wait = new UnityEngine.WaitForSeconds(0.01);
        while(true){
            yield wait;
            if (this.room != null && this.room.IsConnected) {
                // Send Player Transform
                const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.room.SessionId);
                if (hasPlayer) {
                    break;
                }
            }
        }
        console.log(`[Analytics] GoogleAnalytics SendLogEvent 2 ${ZepetoPlayers.instance.LocalPlayer}`);
        console.log(`[Analytics] GoogleAnalytics SendLogEvent 3 ${ZepetoPlayers.instance.LocalPlayer.zepetoPlayer}`);
        console.log(`[Analytics] GoogleAnalytics SendLogEvent 4 ${ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.userId}`);

        const tempUserIds = new Array();
        tempUserIds.push(ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.userId);
        let zepetoId = "";
        console.log(`[Analytics] GoogleAnalytics SendLogEvent 5 `);
        ZepetoWorldHelper.GetUserIdInfo(tempUserIds, (info:Users[]) => {
            zepetoId = info[0].zepetoId;
            console.log(zepetoId + " : " + info[0].zepetoId);
        }, (err) => {
            console.error(err);
        });

        // 유저 아이디를 받아와서 이벤트 키로 설정하여 전송해야함
        console.log(`[Analytics] GoogleAnalytics SendLogEvent 4`);
        while(true) {
            console.log(`[Analytics] UnityEngine.WaitForFixedUpdate 0`);
            yield new UnityEngine.WaitForFixedUpdate();
            if (zepetoId == "") {
                console.log(`zepetoId == empty`);
                continue;
            }
            zepetoId = zepetoId.replace(/\./g, "점"); // '.' 이 들어간 키는 구글 애널리틱스 상에서 받아오지 못하는 오류가 발생하여 '점' 으로 임시 대체
            console.log(`[Analytics] 이 들어간 키는 구글 애널리틱스 상에서 받아오지 못하는 오류가 발생하여 '점' 으로 임시 대체`);

            const time = new Date().toString();
            const google = this.analytics.Analytics(AnalyticsType.GoogleAnalytics);

            google.SetUserId(tempUserIds[0]);
            console.log(`[Analytics] time ${time}`);

            interface CustomEvent {
                AccessTime : string;
            }
            const eventParams:CustomEvent = {
                AccessTime : time,
            };
            
            google.LogEvent<CustomEvent>(zepetoId, eventParams);
            console.log(`google.LogEvent<CustomEvent>(${zepetoId}, ${eventParams.AccessTime})`);
            break;
        }
        this.StopCoroutine(this.Coroutine_GoogleAnalytics_SendLogEvent());
    }
}