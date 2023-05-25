import { Collider } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import OXManager from './OXManager';

export default class OXFailObject extends ZepetoScriptBehaviour {

    OnTriggerEnter(collider : Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return;
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            const manager = this.GetManager();
            manager.OnTouchedFailObject();
        }
    }

    private GetManager() {
        const managerObject = this.transform.parent.parent.parent;
        let manager = managerObject.GetComponent<OXManager>();
        if(manager) return manager; 
        else return managerObject.parent.GetComponent<OXManager>();
    }

}