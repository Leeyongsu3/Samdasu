import { Collider } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Datas } from '../Managers/TypeManager';
import LookAtTrigger from '../Sample Code/LookAtTrigger';

export default class ColliderInputSensor extends ZepetoScriptBehaviour {

    /* Properties */
    private _reviceObject: LookAtTrigger;
    public get reviceObject(): LookAtTrigger {
        return this._reviceObject;
    }
    public set reviceObject(value: LookAtTrigger) {
        if(this._reviceObject) return;
        this._reviceObject = value;
    }

    OnTriggerEnter(collider : Collider) {
        if(!this.reviceObject) return;
        if(!collider.gameObject.CompareTag(Datas.TeleportPoint)) return;
        this.reviceObject.OnSensorTriggerEnter(collider);
    }
}