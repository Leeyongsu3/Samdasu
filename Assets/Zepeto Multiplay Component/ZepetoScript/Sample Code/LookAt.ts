import { Collider, GameObject, SpriteRenderer, Transform, WaitForSeconds } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ButtonType } from '../Managers/TypeManager';
import UIManager from '../Managers/UIManager';
import LookAtTrigger from './LookAtTrigger';

export default class LookAt extends ZepetoScriptBehaviour {

    /* Properties */
    private trigger: LookAtTrigger;
    private renderer: SpriteRenderer;
    private collider: Collider;
    private character: GameObject;
    private isLooking: boolean;
    private playerCam: Transform;
    private wait: WaitForSeconds;
    
    /* public Properties */
    public scriptTarget: Transform;
    public buttonType: ButtonType = ButtonType.NONE;

    Start() {
        this.renderer = this.GetComponent<SpriteRenderer>();
        if(this.renderer) this.renderer.enabled = false;

        this.collider = this.GetComponent<Collider>();
        if(this.collider) this.collider.enabled = false;

        this.trigger = this.transform.parent.GetChild(1).GetComponent<LookAtTrigger>();
    }

    /* Samdasu NPC UI */
    public NPCButtonActivate() {
        if(UIManager.instance.openUI) return;
        this.scriptTarget.gameObject.SetActive(true);
        UIManager.instance.openUI = this.scriptTarget.gameObject;

        // if(this.collider) this.collider.enabled = false;
        // if(this.renderer) this.renderer.enabled = false;
    }

    public StartLooking(col : Collider) {
        if(ZepetoPlayers.instance.LocalPlayer == null) return;
            
        this.character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(col.gameObject != this.character) return;
        
        if(this.collider) this.collider.enabled = true;
        if(this.renderer) this.renderer.enabled = true;
        this.StartCoroutine(this.LookAtLocalPlayer());
    }
    
    public StopLooking(col : Collider) {
        if(col.gameObject != this.character) return;

        if(this.renderer) this.renderer.enabled = false;
        if(this.collider) this.collider.enabled = false;
        this.isLooking = false;
        this.StopCoroutine(this.LookAtLocalPlayer());

        /* Samdasu NPC UI */
        // if(this.buttonType == ButtonType.Cage) {
        //     this.scriptTarget.gameObject.SetActive(false);
        // }
    }

    public RemoteStartLooking() {
        if(ZepetoPlayers.instance.LocalPlayer == null) return;
        
        if(this.trigger.isInTrigger) {
            if(this.collider) this.collider.enabled = true;
            if(this.renderer) this.renderer.enabled = true;
            this.StopCoroutine(this.LookAtLocalPlayer());
            this.StartCoroutine(this.LookAtLocalPlayer());
        } else {
            this.RemoteStopLooking();
        }
    }

    public RemoteStopLooking() {
        if(this.renderer) this.renderer.enabled = false;
        if(this.collider) this.collider.enabled = false;
        this.isLooking = false;
        this.StopCoroutine(this.LookAtLocalPlayer());
    }

    /* Locking Script */
    private * LookAtLocalPlayer() {
        /* Set Init */
        if(!this.playerCam) this.playerCam = ZepetoPlayers.instance.LocalPlayer.zepetoCamera.cameraParent.GetChild(0).transform;
        if(!this.wait) this.wait = new WaitForSeconds(0.06);

        /* Main Script */
        this.transform.LookAt(this.playerCam.position);
        this.isLooking = true;
        while(this.isLooking) {
            yield this.wait;
            this.transform.LookAt(this.playerCam.position);
        }
    }

}