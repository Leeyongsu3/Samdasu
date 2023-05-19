import { Collider } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import OXManager from './OXManager';

export default class OXFailObject extends ZepetoScriptBehaviour {

    private manager: OXManager;

    OnTriggerEnter(collider : Collider) {
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            if(!this.manager) this.manager = this.transform.parent.parent.parent.GetComponent<OXManager>();
            this.manager.OnTouchedFailObject();
        }
    }

}