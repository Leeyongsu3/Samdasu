import { AnimationClip, Animator, GameObject, Mathf, Quaternion, Random, Time, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from '../Managers/GameManager';
import { Anim, Datas, MGRRide } from '../Managers/TypeManager';
import TransformSyncHelper from '../Transform/TransformSyncHelper';

export default class MGRManager extends ZepetoScriptBehaviour {

    /* Merry Go Round Property */
    @Header("Rotate Properties")
    private _isPlay: boolean = false;
    public get isPlay(): boolean { return this._isPlay; }
    public set isPlay(value: boolean) {
        if(this._isPlay != value) {
            this.OnIsPlayChanged(value);
            this._isPlay = value;
        }
    }
    
    @Header("Ride Properties")
    @SerializeField() private buttonObject:GameObject;
    @SerializeField() private rideTarget:Transform;
    private rideTargets:MGRRide[];
    private ridePlayers:string[];
    
    private anim:Animator;
    @SerializeField() private clip:AnimationClip;
    private clipLength:number;

    @Header("Play Properties")
    @SerializeField() private startTime:number = 4;
    private time:number = 0;
    private playTime:number = 0;
    private isStarted = false;
    private _isTriggerOn: boolean = false;
    public get isTriggerOn(): boolean { return this._isTriggerOn; }
    public set isTriggerOn(value: boolean) {
        if(this._isTriggerOn != value) {
            this._isTriggerOn = value;
            console.log(`${this._isTriggerOn} ${!this.isPlay} ==> ${this._isTriggerOn && !this.isPlay}`);
            
            if(this._isTriggerOn && !this.isPlay) this.StartCoroutine(this.StartTrigger());
        }
    }

    private waitTrigger:WaitForSeconds;
    private waitPlay:WaitForSeconds;
    
    /* GameManager */
    public RemoteStart() {
        this.anim = this.GetComponent<Animator>();
        this.clipLength = this.clip.length;

        /* MGR Set */
        this.rideTargets = [];
        this.ridePlayers = [];
        for(const trans of this.rideTarget.GetComponentsInChildren<Transform>()) {
            if(trans.name == Datas.Horse) {
                trans.name = `${Datas.Horse}_${SyncIndexManager.MGR_Id}`;
                const rideData:MGRRide = {
                    transform:trans,
                    isRide:false,
                    id:SyncIndexManager.MGR_Id++,
                };
                this.rideTargets.push(rideData);
            }
        }
        this.isStarted = true;
    }
    
    // private Update() {
    //     if(!this.isStarted) return;

    //     /* Local Trigger Timer */
    //     // if(this.isTriggerOn) {
    //     //     this.time += Time.deltaTime;
    //     //     if(this.time > this.startTime) {
    //     //         this.isTriggerOn = false;
    //     //         this.time = 0;
    //     //         GameManager.instance.MGRisPlay(true);
    //     //     }

    //     // } else if(this.isPlay) {
    //     //     this.playTime += Time.deltaTime;
    //     //     if(this.playTime > this.clipLength) {
    //     //         this.playTime = 0;
    //     //         GameManager.instance.MGRisPlay(false);
    //     //     }
    //     // }
    // }

    /* Trigger Wait 4 Seconds */
    private * StartTrigger() {
        if(!this.waitTrigger) this.waitTrigger = new WaitForSeconds(4);
        console.log(this.waitTrigger);
        
        yield this.waitTrigger;

        console.log(`Try StartTrigger.....`);
        
        if(this.isTriggerOn && !this.isPlay) {
            this.isTriggerOn = false;
            GameManager.instance.MGRisPlay(true);
            console.log(`SEND StartTrigger.....!!!`);
        }
        this.StopCoroutine(this.StartTrigger());
    }

    /* Play Wait Animation Length */
    private * StartWaitPlay() {
        this.StopCoroutine(this.StartTrigger());
        if(!this.waitPlay) this.waitPlay = new WaitForSeconds(this.clipLength);
        yield this.waitPlay;

        console.log(`Try StartWaitPlay.....!!!`);

        if(this.isPlay) {
            GameManager.instance.MGRisPlay(false);
            console.log(`SEND StartWaitPlay.....!!!`);
        }
        this.StopCoroutine(this.StartWaitPlay());
    }

    /* Get Ride Horse Target */
    public GetRideTarget(sessionId:string) {
        for(const rideData of this.rideTargets) {
            if(!rideData.isRide) {
                rideData.isRide = true;
                this.ridePlayers.push(sessionId);
                return rideData.transform.GetChild(0);
            }
        }
        return null;
    }

    /* Remote Getout Player */
    public RideOffPlayer(sessionId:string) {
        const index = this.ridePlayers.indexOf(sessionId);
        if(index < 0) return false;
        this.ridePlayers.splice(index, 1);
        return true;
    }

    /* On IsPlayState Change */
    private OnIsPlayChanged(newVal:boolean) {
        this.buttonObject.SetActive(!newVal);
        
        /* Player Ride Off */
        if(newVal) {
            for(const sessionId of this.ridePlayers) {
                const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
                const helper = character.GetComponent<TransformSyncHelper>();
                helper.SyncRotation = false;
                helper.SyncPosition = false;
            }
            this.anim.SetTrigger(Anim.Play);
            this.StartCoroutine(this.StartWaitPlay());

        } else {
            for(const sessionId of this.ridePlayers) {
                GameManager.instance.RemoteRideOffMerryGoRound(sessionId);
                const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
                const helper = character.GetComponent<TransformSyncHelper>();
                helper.SyncRotation = true;
                helper.SyncPosition = true;
            }
            this.ridePlayers = [];
            for(const rideData of this.rideTargets) {
                rideData.isRide = false;
            }
        }
        this.isTriggerOn = false;
        this.playTime = 0;
        this.time = 0;
    }
}