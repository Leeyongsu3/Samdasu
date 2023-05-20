import { Collider } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Datas } from '../Managers/TypeManager';
import LookAtTrigger from '../Sample Code/LookAtTrigger';

export default class ColliderInputSensor extends ZepetoScriptBehaviour {

    /* Properties */
    private _receiveObject: LookAtTrigger;
    public get receiveObject(): LookAtTrigger {
        return this._receiveObject;
    }
    public set receiveObject(value: LookAtTrigger) {
        if(this._receiveObject) return;
        this._receiveObject = value;
    }

    OnTriggerEnter(collider : Collider) {
        if(!this.receiveObject) return;
        if(!collider.gameObject.CompareTag(Datas.TeleportPoint)) return;
        this.receiveObject.OnSensorTriggerEnter(collider);
    }
}