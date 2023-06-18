import { Animator, GameObject, Transform } from 'UnityEngine';
import { SpawnInfo, ZepetoCharacter, ZepetoCharacterCreator, ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Anim, Datas } from './Managers/TypeManager';
import TransformSyncHelper, { SyncIndexType } from './Transform/TransformSyncHelper';

export default class TESTER extends ZepetoScriptBehaviour {

    // /* Singleton */
    // private static _instance: TESTER = null;
    // public static get instance(): TESTER {
    //     if (this._instance === null) {
    //         this._instance = GameObject.FindObjectOfType<TESTER>();
    //         if (this._instance === null) {
    //             this._instance = new GameObject(TESTER.name).AddComponent<TESTER>();
    //         }
    //     }
    //     return this._instance;
    // }
    
    // /* Singleton */
    // private Awake() {
    //     if (TESTER._instance !== null && TESTER._instance !== this) {
    //         GameObject.Destroy(this.gameObject);
    //     } else {
    //         TESTER._instance = this;
    //         GameObject.DontDestroyOnLoad(this.gameObject);
    //     }
    // }
    

    // private isSync:boolean = false;
    // private localSessionId:string;
    // public character:ZepetoCharacter;
    // private targetAnim: Animator;
    // private anim: Animator;
    // public Create(sessionId:string, point:Transform) {
    //     const spawnInfo = new SpawnInfo();
    //     spawnInfo.position = point.position;
    //     spawnInfo.rotation = point.rotation;

    //     this.localSessionId = sessionId;
    //     this.targetAnim = ZepetoPlayers.instance.GetPlayer(sessionId).character.ZepetoAnimator;
        
    //     /* Create and Init NPC */
    //     ZepetoCharacterCreator.CreateByZepetoId(Datas.kuaId, spawnInfo, (character: ZepetoCharacter) => {
    //         this.anim = character.ZepetoAnimator;
    //         this.character = character;

    //         const tfHelper = character.gameObject.AddComponent<TransformSyncHelper>();
    //         tfHelper.Id = sessionId;
    //         tfHelper.isOwner = false;
    //         tfHelper.syncIndexType = SyncIndexType.Instantiate;
    //         this.isSync = true;
    //     })
    // }

    // public SyncConnection(connect:boolean) {
    //     const helper = this.character.GetComponent<TransformSyncHelper>();
    //     helper.SyncPosition = connect;
    //     helper.SyncRotation = connect;
    // }

    // Update() {
    //     if(!this.isSync) return;
    //     this.anim.SetInteger(Anim.State, this.targetAnim.GetInteger(Anim.State));
    //     this.anim.SetInteger(Anim.MoveState, this.targetAnim.GetInteger(Anim.MoveState));
    //     this.anim.SetInteger(Anim.JumpState, this.targetAnim.GetInteger(Anim.JumpState));
    //     this.anim.SetInteger(Anim.LandingState, this.targetAnim.GetInteger(Anim.LandingState));
    //     this.anim.SetFloat(Anim.MotionSpeed, this.targetAnim.GetFloat(Anim.MotionSpeed));
    //     this.anim.SetFloat(Anim.FallSpeed, this.targetAnim.GetFloat(Anim.FallSpeed));
    //     this.anim.SetFloat(Anim.Acceleration, this.targetAnim.GetFloat(Anim.Acceleration));
    //     this.anim.SetFloat(Anim.MoveProgress, this.targetAnim.GetFloat(Anim.MoveProgress));
    //     this.anim.SetBool(Anim.isSit, this.targetAnim.GetBool(Anim.isSit));
    //     this.anim.SetBool(Anim.isHold, this.targetAnim.GetBool(Anim.isHold));
    //     this.anim.SetInteger(Anim.SamdasuState, this.targetAnim.GetInteger(Anim.SamdasuState));
    // }

}