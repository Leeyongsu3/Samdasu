import { Collider, GameObject, Transform } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from '../Managers/GameManager';
import { StampType } from '../Managers/TypeManager';
import OXManager from './OXManager';

export default class OXClearController extends ZepetoScriptBehaviour {

    /* Controllers Properties */
    @SerializeField() private targetUI:GameObject;
    private returnPos:Transform;
    private manager:OXManager;
    
    Start() {
        /* Set OX Manager */
        if(!this.returnPos) this.returnPos = this.transform.parent;
        this.manager = this.returnPos.GetComponent<OXManager>();
    }

    OnTriggerEnter(collider : Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return;
        
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) return;
        if(this.manager.isComplete) {
            console.log(` <<<<<<<< COMPLETE >>>>>>>> `);
            this.manager.OnClearOXZone();
        
            /* Samdasu Drink Stamp Check */
            const quizStamp = SyncIndexManager.STAMPS.get(StampType.STAMP_OX_QUIZ);
            if(!quizStamp.isClear) GameManager.instance.ClearStampMission(StampType.STAMP_OX_QUIZ);
        } else {
            console.log(` >>>>>>>> NO <<<<<<<< `);
        }
    }
}