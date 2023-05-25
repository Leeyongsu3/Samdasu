import { GameObject, Transform } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from '../Managers/GameManager';
import { OXData, OXType, StampType } from '../Managers/TypeManager';
import OXClearController from './OXClearController';
import OXController from './OXController';

export default class OXManager extends ZepetoScriptBehaviour {

    /* Managers Properties */
    private datas:OXData[] = [];

    public RemoteStart() {
        for(const trans of this.transform.GetComponentsInChildren<Transform>()) {
            if(trans.name.includes(OXType.OX_WALL)) {
                /* OX Wall */
                console.log(trans.name);
                const con = trans.GetComponent<OXController>();
                if(con) {
                    const data:OXData = { controller:con, isPassed:false, };
                    this.datas.push(data);
                    con.RemoteStart(this);
                } else {
                    /* OX Clear Wall */
                    trans.gameObject.SetActive(true);
                }

            } else if(trans.name.includes(OXType.OX_SUCCESSED)) {
                /* OX Successed */
                console.log(trans.name);
                trans.gameObject.SetActive(false);

            } else if(trans.name.includes(OXType.OX_CLEAR)) {
                /* OX Clear */
                console.log(trans.name);
                const con = trans.GetComponent<OXClearController>();
                if(con) {
                    con.RemoteStart(this);
                }
            }
        }
    }

    /** Controller Call **/
    /* Passed OX Block */
    public OnOXPassed(controller:OXController) {
        for(const data of this.datas) {
            if(data.controller == controller) {
                data.isPassed = true;
                console.log(data.isPassed);
                break;
            }
        }
    }

    /* Fail Object Script */
    public OnTouchedFailObject() {
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        character.Teleport(this.transform.position, this.transform.rotation);
        for(const data of this.datas) {
            data.controller.Reset();
        }
    }

    /* Clear OX Zone */
    public OnClearOXZone() {
        for(const data of this.datas) {
            data.controller.OnMissionClear();
        }
        
        /* Samdasu Drink Stamp Check */
        const quizStamp = SyncIndexManager.STAMPS.get(StampType.STAMP_OX_QUIZ);
        if(!quizStamp.isClear) GameManager.instance.ClearStampMission(StampType.STAMP_OX_QUIZ);
    }

    /* Is Complete? */
    public get isComplete(): boolean {
        if(!this.datas || this.datas.length == 0) return false;
        for(const data of this.datas) {
            if(!data.isPassed) {
                return false;
            }
        }
        return true;
    }
}