import { Collider, GameObject, Quaternion, SphereCollider, Transform, Vector3 } from 'UnityEngine';
import { ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameManager from '../Managers/GameManager';
import { ButtonType, Datas } from '../Managers/TypeManager';
import ColliderInputSensor from '../SamdasuScript/ColliderInputSensor';
import LookAt from './LookAt';

export default class LookAtTrigger extends ZepetoScriptBehaviour {

    /* Default Properties */
    private lookAt: LookAt;
    private col: SphereCollider;

    /* Samdasu Properties */
    @SerializeField() private colliderInputSensor: GameObject;

    Start() {
        this.lookAt = this.transform.parent.GetComponentInChildren<LookAt>();

        if(this.colliderInputSensor) {
            const in_sensor = this.colliderInputSensor.gameObject.GetComponent<ColliderInputSensor>();
            in_sensor.receiveObject = this;
        }
        
        this.col = this.gameObject.GetComponent<SphereCollider>();
    }

    OnTriggerEnter(collider : Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return;
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            this.lookAt.StartLooking(collider);
        }
    }
    
    OnTriggerExit(collider : Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return;
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            this.lookAt.StopLooking(collider);
        }
    }

    /* Recive Sensor */
    public OnSensorTriggerEnter(collider : Collider) {
        /* Connect Cabin */
        if(!collider.gameObject.CompareTag(Datas.TeleportPoint)) return;
        this.lookAt.scriptTarget = collider.transform;
        if(this.lookAt.buttonType == ButtonType.Ride_Wheel) {
            GameManager.instance.targetCarbin = collider.transform;
        }
        
        /* Find Player */
        if(collider.transform.childCount > 0) {
            const collider_character = collider.transform.GetChild(0).GetComponent<ZepetoCharacter>();
            GameManager.instance.RemoteRideOffWheel(collider_character);
        }
    }

    /* Player is In Trigger? */
    public get isInTrigger(): boolean {
        if(this.GetDistanceToLocalPlayer() < this.col.radius) return true;
        return false;
    }

    /* Get Distance to Local Player */
    public GetDistanceToLocalPlayer() {
        if(!ZepetoPlayers.instance.LocalPlayer) return 1000;
        return Vector3.Distance(ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.transform.position, this.transform.position);
    }
}