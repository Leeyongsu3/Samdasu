import { BoxCollider, GameObject } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameManager from '../Managers/GameManager';
import { Anim, SendName } from '../Managers/TypeManager';

export default class ChairSit extends ZepetoScriptBehaviour {
    
    /* Properties */
    private _localSessionId: string;
    public get localSessionId(): string { return this._localSessionId; }
    public set localSessionId(value: string) {
        if(this._localSessionId == null && value) this._localSessionId = value;
    }
    private chairId: string;
    public get Id(): string { return this.chairId; }
    private isSit:bool = false;
    private boxCol:BoxCollider;
    private remoteStarted:boolean = false;
    @SerializeField() private buttonObject:GameObject;

    public RemoteStart(id:string) {
        this.chairId = id;
        this.boxCol = this.transform.GetComponent<BoxCollider>();
        if(!this.buttonObject) this.buttonObject = this.transform.GetChild(2).gameObject;
        this.remoteStarted = true;
    }
    
    /* Button on off */
    public ButtonOnOff(onOff:bool) {
        this.boxCol.enabled = onOff;
        this.buttonObject.SetActive(onOff);
    }
    
    /* Sit Chair */
    public PlayerSitDown(sessionId:string) {
        if(this.isSit) return;
        this.isSit = true;
        this.ButtonOnOff(false);

        if(!ZepetoPlayers.instance.HasPlayer(sessionId)) return;
        this.StartCoroutine(this.StartContinuousAnimation(sessionId));
    }

    private * StartContinuousAnimation(sessionId:string) {
        /* Player Setting */
        const sitPosition = this.transform.GetChild(1);
        const player = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        player.transform.parent = this.transform;
        player.Teleport(sitPosition.position, sitPosition.rotation);

        /* Local Player Change Animation */
        if(sessionId != this.localSessionId) return; 
        const anim = player.ZepetoAnimator;
        while(anim.GetBool(Anim.isSit)) {
            yield null;
        }
        this.SitControl(true)
        while(true) {
            if(player.tryJump || player.tryMove) {
                GameManager.instance.PlayerSendSitUp(this.chairId);
                break;
            }
            yield null;
        }
    }

    /* Recieve ChairSitUp */
    public PlayerSitUp(sessionId:string) {
        if(!this.isSit) return;
        this.isSit = false;
        this.ButtonOnOff(true);

        /* Player Setting */
        if(!ZepetoPlayers.instance.HasPlayer(sessionId)) return;
        const player = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        player.transform.parent = null;

        /* Local Player Change Animation */
        if(sessionId != this.localSessionId) return; 
        this.SitControl(false);
    }

    /* Animation Play */
    private SitControl(sit:boolean) {
        ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.ZepetoAnimator.SetBool(SendName.isSit, sit);
    }
}