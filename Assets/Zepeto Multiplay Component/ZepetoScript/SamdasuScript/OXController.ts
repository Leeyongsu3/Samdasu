import { Animator, BoxCollider, Collider, GameObject, Transform } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Anim } from '../Managers/TypeManager';
import OXManager from './OXManager';

export default class OXController extends ZepetoScriptBehaviour {

    /* Controllers Properties */
    @SerializeField() private answer:boolean;
    @SerializeField() private targetUI:GameObject;
    @SerializeField() private targetFailed:GameObject;
    @SerializeField() private targetSuccessed:GameObject;
    private o_button:Button;
    private x_button:Button;
    private block:BoxCollider;
    private manager:OXManager;
    private onFailAnim:Animator;
    
    Start() {
        /* Set OX Manager */
        this.manager = this.transform.parent.GetComponent<OXManager>();
        
        /* Set Properties */
        this.block = this.transform.GetChild(0).GetComponent<BoxCollider>();
        this.o_button = this.targetUI.transform.GetChild(0).GetComponent<Button>();
        this.x_button = this.targetUI.transform.GetChild(1).GetComponent<Button>();
        this.targetFailed.SetActive(false);
        this.targetSuccessed.SetActive(false);
        this.onFailAnim = this.targetFailed.GetComponent<Animator>();
        
        /* Set ButtonScript */
        if(this.answer) {
            // o_button == answer
            this.o_button.onClick.AddListener( () => this.MissionSuccessed());
            this.x_button.onClick.AddListener( () => this.MissionFailed());
        } else {
            // x_button == answer
            this.o_button.onClick.AddListener( () => this.MissionFailed());
            this.x_button.onClick.AddListener( () => this.MissionSuccessed());
        }
    }

    /* Mission Trigger */
    private OnTriggerEnter(collider : Collider) {
        if(this.block.enabled) this.targetUI.SetActive(true);
    }

    /* Mission Failed */
    private MissionFailed() {
        this.OnOXPassed();
        this.targetFailed.SetActive(true);
        this.onFailAnim.SetBool(Anim.Active, true);
    }
    
    /* Mission Successed */
    private MissionSuccessed() {
        this.OnOXPassed();
        this.targetSuccessed.SetActive(true);
    }

    /** Manager Call **/
    /* All Mission Clear */
    public OnMissionClear() {
        this.onFailAnim.SetBool(Anim.Active, false);
        this.targetFailed.SetActive(false);
        this.targetSuccessed.SetActive(true);
        this.targetUI.SetActive(false);
        this.block.enabled = false;
        if(this.answer) {
            // o_button == answer
            this.o_button.onClick.RemoveListener( this.MissionSuccessed );
            this.x_button.onClick.RemoveListener( this.MissionFailed );
        } else {
            // x_button == answer
            this.o_button.onClick.RemoveListener( this.MissionFailed );
            this.x_button.onClick.RemoveListener( this.MissionSuccessed);
        }
    }

    /* Reset Game */
    public Reset() {
        this.onFailAnim.SetBool(Anim.Active, false);
        this.targetFailed.SetActive(false);
        this.targetSuccessed.SetActive(false);
        this.targetUI.SetActive(false);
        this.block.enabled = true;
    }

    /* Call Manager */
    private OnOXPassed() {
        this.targetUI.SetActive(false);
        this.block.enabled = false;
        this.manager.OnOXPassed(this);
    }

}