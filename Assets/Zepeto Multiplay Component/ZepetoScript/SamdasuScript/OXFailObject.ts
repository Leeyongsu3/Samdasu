import { Collider } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import OXManager from './OXManager';

export default class OXFailObject extends ZepetoScriptBehaviour {

    OnTriggerEnter(collider : Collider) {
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            const manager = this.transform.parent.parent.parent.GetComponent<OXManager>();
            manager.OnTouchedFailObject();
        }
    }

}