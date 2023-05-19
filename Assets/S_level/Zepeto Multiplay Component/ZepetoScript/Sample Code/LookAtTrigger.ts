import { Collider, GameObject, Quaternion, Transform } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameManager from '../Managers/GameManager';
import { StampType } from '../Managers/UIManager';
import ColliderInputSensor from '../SamdasuScript/ColliderInputSensor';
import LookAt from './LookAt';

export default class LookAtTrigger extends ZepetoScriptBehaviour {

    /* Default Properties */
    private lookAt : LookAt;

    /* Samdasu Properties */
    @SerializeField() private colliderInputSensor: GameObject;

    private readonly teleportPoint:string = "TeleportPoint";

    Start() {
        this.lookAt = this.transform.parent.GetComponentInChildren<LookAt>();

        if(this.colliderInputSensor) {
            const in_sensor = this.colliderInputSensor.gameObject.GetComponent<ColliderInputSensor>();
            in_sensor.reviceObject = this;
        }
    }

    OnTriggerEnter(collider : Collider) {
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            this.lookAt.StartLooking(collider);
        }
    }
    
    OnTriggerExit(collider : Collider) {
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            this.lookAt.StopLooking(collider);
        }
    }

    /* Recive Sensor */
    public OnSensorTriggerEnter(collider : Collider) {
        /* Connect Cabin */
        if(!collider.gameObject.CompareTag(this.teleportPoint)) return;
        this.lookAt.scriptTarget = collider.transform;
        
        /* Find Player */
        if(collider.transform.childCount > 0) {
            const collider_character = collider.transform.GetChild(0).GetComponent<ZepetoCharacter>();
            GameManager.instance.RemoteRideOffWheel(collider_character);
        }
    }
}