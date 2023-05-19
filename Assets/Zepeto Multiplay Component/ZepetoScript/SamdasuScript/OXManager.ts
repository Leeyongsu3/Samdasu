import { GameObject, Transform } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import { OXData } from '../Managers/TypeManager';
import OXController from './OXController';

export default class OXManager extends ZepetoScriptBehaviour {

    /* Managers Properties */
    private datas:OXData[] = [];

    Start() {
        for(const trans of this.transform.GetComponentsInChildren<Transform>()) {
            const con = trans.GetComponent<OXController>();
            if(con) {
                const data:OXData = { controller:con, isPassed:false, };
                this.datas.push(data);
            }
        }
    }

    /** Controller Call **/
    /* Passed OX Block */
    public OnOXPassed(controller:OXController) {
        for(const data of this.datas) {
            if(data.controller == controller) {
                data.isPassed = true;
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