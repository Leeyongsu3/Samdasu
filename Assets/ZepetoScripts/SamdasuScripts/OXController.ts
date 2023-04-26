import { BoxCollider, Collider, GameObject, Transform } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import OXManager from './OXManager';

export default class OXController extends ZepetoScriptBehaviour {

    /* Controllers Properties */
    @SerializeField() private answer:boolean;
    @SerializeField() private targetUI:GameObject;
    private o_button:Button;
    private x_button:Button;
    private block:BoxCollider;
    private returnPos:Transform;
    private manager:OXManager;
    
    Start() {
        /* Set OX Manager */
        if(!this.returnPos) this.returnPos = this.transform.parent;
        this.manager = this.returnPos.GetComponent<OXManager>();
        
        /* Set Properties */
        this.block = this.transform.GetChild(0).GetComponent<BoxCollider>();
        this.o_button = this.targetUI.transform.GetChild(0).GetComponent<Button>();
        this.x_button = this.targetUI.transform.GetChild(1).GetComponent<Button>();
        
        /* Set ButtonScript */
        if(this.answer) {
            // o_button == answer
            this.o_button.onClick.AddListener( () => {
                this.targetUI.SetActive(false);
                this.block.enabled = false;
            })
            this.x_button.onClick.AddListener( () => {
                this.targetUI.SetActive(false);
                this.manager.MissionFailed();
            })
        } else {
            // x_button == answer
            this.o_button.onClick.AddListener( () => {
                this.targetUI.SetActive(false);
                this.manager.MissionFailed();
            })
            this.x_button.onClick.AddListener( () => {
                this.targetUI.SetActive(false);
                this.block.enabled = false;
            })
        }
    }

    OnTriggerEnter(collider : Collider) {
        if(this.block.enabled) this.targetUI.SetActive(true);
    }
    
    // OnTriggerExit(collider : Collider) {
    // }

    /* Manager Call */
    public SetBlock(value:boolean) {
        this.block.enabled = value;
    }

}