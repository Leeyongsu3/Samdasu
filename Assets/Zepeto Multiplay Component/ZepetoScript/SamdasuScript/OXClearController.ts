import { Collider, GameObject, Transform } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import OXManager from './OXManager';

export default class OXClearController extends ZepetoScriptBehaviour {

    /* Controllers Properties */
    private manager:OXManager;
    
    /* OXManager */
    public RemoteStart(manager:OXManager) {
        /* Set OX Manager */
        this.manager = manager;
    }

    OnTriggerEnter(collider : Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return;
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        console.log(`OnTriggerEnter 0`);
        if(collider.gameObject == character) return;
        console.log(`OnTriggerEnter 1`);
        if(this.manager.isComplete) {
            console.log(` <<<<<<<< COMPLETE >>>>>>>> `);
            this.manager.OnClearOXZone();
        } else {
            console.log(` >>>>>>>> NO <<<<<<<< `);
        }
    }
}