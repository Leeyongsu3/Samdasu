import { Animator, CharacterController, GameObject, Quaternion, Transform, WaitForSeconds } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameManager from '../Managers/GameManager';
import { Anim, SamdasuState } from '../Managers/TypeManager';
import TESTER from '../TESTER';
import TransformSyncHelper from '../Transform/TransformSyncHelper';

export default class FlumeRideManager extends ZepetoScriptBehaviour {

    @SerializeField() private buttonObject:GameObject;
    @SerializeField() private transformSupporter:Transform;
    @SerializeField() private board:GameObject;
    @SerializeField() private poolPoint:Transform;
    private _localSessionId: string;
    public get localSessionId(): string { return this._localSessionId; }
    public set localSessionId(value: string) {
        if(this._localSessionId == null && value) {
            this._localSessionId = value;
        }
    }
    private wait:WaitForSeconds;

    /* Button Control */
    public WaitRide(ownerSessionId:string, isWait:boolean) {
        this.buttonObject.SetActive(!isWait);
        if(isWait) {
            this.RideFlumeRide(ownerSessionId);
        }
    }

    /* Ride FlumeRide */
    private RideFlumeRide(ownerSessionId:string) {
        /* Get Player */
        const character = ZepetoPlayers.instance.GetPlayer(ownerSessionId).character;

        /* Controller OFF */
        const characterController = character.transform.GetComponent<CharacterController>();
        characterController.enabled = false;
        if(this.localSessionId == ownerSessionId) GameManager.instance.LocalPlayerControllerSet(false);
        
        /* Ride Slide Board */
        const board = GameObject.Instantiate(this.board, this.transformSupporter) as GameObject;
        character.Teleport(board.transform.position, Quaternion.Euler(0, 180, 0));
        character.transform.SetParent(board.transform);
        GameManager.instance.CharacterShadowVisibler(ownerSessionId, false);

        /* Play Board Animation */
        const boardAnim = board.GetComponent<Animator>();
        boardAnim.SetTrigger(Anim.BoardSlide);
        this.SyncConnection(ownerSessionId, false);
        if(this.localSessionId == ownerSessionId) GameManager.instance.SetSamdasuState(SamdasuState.Ride_FlumeRide, true);

        this.StartCoroutine(this.RideOffFlumeRide(ownerSessionId, board));
    }

    /* Ride OFF FlumeRide */
    private * RideOffFlumeRide(ownerSessionId:string, board:GameObject) {
        /* Get Player */
        const character = ZepetoPlayers.instance.GetPlayer(ownerSessionId).character;

        if(!this.wait) this.wait = new WaitForSeconds(5);
        yield this.wait;

        /* Controller ON */
        const characterController = character.transform.GetComponent<CharacterController>();
        characterController.enabled = true;
        if(this.localSessionId == ownerSessionId) GameManager.instance.LocalPlayerControllerSet(true);
        
        /* Ride OFF Slide Board */
        character.Teleport(this.poolPoint.transform.position, Quaternion.identity);
        character.transform.SetParent(null);
        GameManager.instance.CharacterShadowVisibler(ownerSessionId, true);

        this.SyncConnection(ownerSessionId, true);

        /* Board Destroy */
        yield this.wait;
        GameObject.Destroy(board);
    }

    private SyncConnection(sessionId, connect:boolean) {
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        const helper = character.GetComponent<TransformSyncHelper>();
        helper.SyncPosition = connect;
        helper.SyncRotation = connect;
        console.log(` [SyncConnection] ${this.localSessionId == sessionId?"LocalPlayer":"OtherPlayer"} : ${character.name} is ${connect?"Connected":"Disconnected"}`);
        
    }
}