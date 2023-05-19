import { Animator, GameObject, Mathf, Quaternion, Random, Time, Transform, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from '../Managers/GameManager';
import { Datas, MGRRide } from '../Managers/TypeManager';
import TransformSyncHelper from '../Transform/TransformSyncHelper';

export default class MGRManager extends ZepetoScriptBehaviour {

    /* Merry Go Round Property */
    @Header("Rotate Properties")
    @SerializeField() private rotateSpeed:number = 50;
    @SerializeField() private coolTime:number = 15;
    @SerializeField() private playTime:number = 30;
    private _isPlay: boolean = false;
    public get isPlay(): boolean { return this._isPlay; }
    public set isPlay(value: boolean) {
        if(this._isPlay != value) this.OnIsPlayChanged(value);
        this._isPlay = value;
    }
    private timer:number = 0;
    private currentSpeed:number = 0;
    private readonly minSpeed:number = 3;
    
    @Header("Ride Properties")
    @SerializeField() private buttonObject:GameObject;
    @SerializeField() private rideTarget:Transform;
    private rideTargets:MGRRide[];
    private ridePlayers:string[];

    /* Default Property */
    private m_tfHelper:TransformSyncHelper;
    
    private Start() {
        /* Default Init */
        this.m_tfHelper = this.GetComponent<TransformSyncHelper>();
        this.m_tfHelper.rotateSpeed = this.rotateSpeed;

        /* MGR Set */
        this.currentSpeed = 0;
        this.ridePlayers = [];
        this.rideTargets = [];
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
    }

    private FixedUpdate() {
        /* Main Rotate */
        if(!this.m_tfHelper.isOwner) return;
        if(this.isPlay) {
            if(this.timer < this.playTime && this.currentSpeed < this.rotateSpeed-1) {
                /* Rotate Start : Accel++ */
                this.currentSpeed = Mathf.Lerp(this.currentSpeed, this.rotateSpeed, Time.deltaTime / 2);

            } else if(this.timer < this.playTime && this.currentSpeed >= this.rotateSpeed-1) {
                /* Rotating */
                this.timer += Time.deltaTime;
                this.currentSpeed = Mathf.Lerp(this.currentSpeed, this.rotateSpeed, Time.deltaTime / 2);

            } else if(this.timer > this.playTime && this.currentSpeed > this.minSpeed) {
                /* Rotate Stop : Accel-- */
                this.currentSpeed = Mathf.Lerp(this.currentSpeed, 0, Time.deltaTime / 2);
                this.timer += Time.deltaTime;

            } else if(this.timer > this.playTime && this.currentSpeed <= this.minSpeed) {
                /* State Change */
                this.timer = 0;
                this.isPlay = false;
            }

            /* Play Rotate */
            const y = (this.currentSpeed * Time.deltaTime) % 360;
            this.transform.eulerAngles = new Vector3(
                this.transform.rotation.eulerAngles.x,
                this.transform.rotation.eulerAngles.y - y,
                this.transform.rotation.eulerAngles.z);

        } else {
            /* Stop Rotate */
            this.timer += Time.deltaTime;
            this.currentSpeed = Mathf.Lerp(this.currentSpeed, 0, Time.deltaTime);
            
            /* State Change */
            if(this.timer > this.coolTime) {
                this.timer = 0;
                this.isPlay = true;
            }
        }
        this.m_tfHelper.rotateSpeed = this.currentSpeed;
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
        if(!newVal) {
            for(const sessionId of this.ridePlayers) {
                GameManager.instance.RemoteRideOffMerryGoRound(sessionId);
            }
            this.ridePlayers = [];
            for(const rideData of this.rideTargets) {
                rideData.isRide = false;
            }
        }
    }
}