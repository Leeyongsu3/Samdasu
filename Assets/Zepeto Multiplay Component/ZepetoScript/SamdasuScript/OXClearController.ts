import { BoxCollider, Collider, GameObject, Transform } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
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
        if(this.manager.isComplete) {
            console.log(` <<<<<<<< COMPLETE >>>>>>>> `);
            this.manager.OnClearOXZone();
            GameManager.instance.ClearStampMission(StampType.STAMP_OX_QUIZ);
        } else {
            console.log(` >>>>>>>> NO <<<<<<<< `);
        }
    }
}