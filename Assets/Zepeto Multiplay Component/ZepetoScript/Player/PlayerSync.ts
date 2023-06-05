import {ZepetoScriptBehaviour} from 'ZEPETO.Script'
import {RoomBase, RoomData} from 'ZEPETO.Multiplay';
import {ZepetoWorldMultiplay} from "ZEPETO.World";
import {CharacterJumpState, CharacterMoveState, CharacterState, ZepetoPlayer, ZepetoPlayers} from 'ZEPETO.Character.Controller';
import { RuntimeAnimatorController, Object, Animator, AnimatorClipInfo, Resources,CharacterController, AnimationClip, WaitForSeconds, AnimatorOverrideController, Mathf, WaitForEndOfFrame} from 'UnityEngine';
import {Player, Stamp, Sticker} from 'ZEPETO.Multiplay.Schema';
import MultiplayManager from '../Common/MultiplayManager';
import TransformSyncHelper from '../Transform/TransformSyncHelper';
import ZepetoPlayersManager from './ZepetoPlayersManager';
import CameraManager from '../Managers/CameraManager';
import SyncIndexManager from '../Common/SyncIndexManager';
import UIManager from '../Managers/UIManager';
import { Anim, MESSAGE, PlayerMove, SamdasuState, SendName } from '../Managers/TypeManager';
import GameManager from '../Managers/GameManager';

export default class PlayerSync extends ZepetoScriptBehaviour {

    /* Player Sync Properties */
    @HideInInspector() public isLocal: boolean = false;
    @HideInInspector() public player: Player;
    @HideInInspector() public zepetoPlayer: ZepetoPlayer;
    @HideInInspector() public tfHelper: TransformSyncHelper;
    @HideInInspector() public isUseInjectSpeed: boolean = false;
    @HideInInspector() public GetAnimationClipFromResources : boolean = true;
    @HideInInspector() public UseZepetoGestureAPI: boolean = false;

    private readonly _tick: number = 0.04;
    private _animator: Animator;
    private _multiplay: ZepetoWorldMultiplay;
    private _room: RoomBase;

    /* Samdasu Properties */
    private prevSamdasuState: number;
    private mgrIsPlay: boolean;

    private Start() {
        this._animator = this.transform.GetComponentInChildren<Animator>();
        this._multiplay = Object.FindObjectOfType<ZepetoWorldMultiplay>();
        this._room = this._multiplay.Room;
        if (this.isLocal) {
            this.StartCoroutine(this.SendLocalPlayer(this._tick));
        } else{
            this.player.OnChange += (ChangeValue) => this.OnChangedPlayer();
            //If this is not a local character, do not use State Machine.
            this.zepetoPlayer.character.StateMachine.Stop();
            // console.log(`otherPlayers SamdasuState : ${SamdasuState[this.player.animationParam.SamdasuState]}`);
            
        }
        
        /* Samdasu */
        this._room.AddMessageHandler(MESSAGE.MGR_Play, (message:any) => {
            this.mgrIsPlay = message.isPlay;
        });
    }

    // !isLocal(other player)
    private OnChangedPlayer() {
        if (this.isLocal) return
        const animationParam = this.player.animationParam;
        const animator = this._animator;
        animator.SetInteger(Anim.State, animationParam.State);
        animator.SetInteger(Anim.MoveState, animationParam.MoveState);
        animator.SetInteger(Anim.JumpState, animationParam.JumpState);
        animator.SetInteger(Anim.LandingState, animationParam.LandingState);
        animator.SetFloat(Anim.MotionSpeed, animationParam.MotionSpeed);
        animator.SetFloat(Anim.FallSpeed, animationParam.FallSpeed);
        animator.SetFloat(Anim.Acceleration, animationParam.Acceleration);
        animator.SetFloat(Anim.MoveProgress, animationParam.MoveProgress);
        animator.SetBool(Anim.isSit, animationParam.isSit);
        animator.SetBool(Anim.isHold, animationParam.isHold);
        animator.SetInteger(Anim.SamdasuState, animationParam.SamdasuState);

        /* When Player Ride MGR */
        const mgrChecker = animationParam.SamdasuState == SamdasuState.Ride_MGR && this.mgrIsPlay;
        this.tfHelper.SyncRotation = !mgrChecker;

        //sync gesture
        if (animationParam.State == CharacterState.Gesture && ( this.UseZepetoGestureAPI || this.GetAnimationClipFromResources )) { 
            const clipInfo: AnimatorClipInfo[] = this._animator.GetCurrentAnimatorClipInfo(0);
            const gestureName = this.player.gestureName;
            
            if (!gestureName || clipInfo[0].clip.name === gestureName) return;
            let animClip: AnimationClip | null = null;
            if (this.UseZepetoGestureAPI && ZepetoPlayersManager.instance.GestureAPIContents.has(gestureName)) {
                const content = ZepetoPlayersManager.instance.GestureAPIContents.get(gestureName);
                if (!content.IsDownloadedAnimation) {
                    // If the animation has not been downloaded, download it.
                    content.DownloadAnimation(() => {
                        // play animation clip
                        this.zepetoPlayer.character.SetGesture(content.AnimationClip);
                    });                       
                    return;
                } else {
                    animClip = content.AnimationClip;
                }
            } else if(this.GetAnimationClipFromResources)// Resources animation.
                animClip = Resources.Load<AnimationClip>(gestureName);
            
            if (null == animClip) { 
                // When the animation is not in the /Asset/Resources file pass
                console.warn(`${gestureName} is null, Add animation in the Resources folder.`);
            } else {
                this.zepetoPlayer.character.SetGesture(animClip);
            }
        }
        
        if(animationParam.State === CharacterState.Teleport){
            this.StartCoroutine(this.WaitTeleportFrame(5));
        }

        const playerAdditionalValue = this.player.playerAdditionalValue;
        this.zepetoPlayer.character.additionalWalkSpeed = playerAdditionalValue.additionalWalkSpeed;
        this.zepetoPlayer.character.additionalRunSpeed = playerAdditionalValue.additionalRunSpeed;
        this.zepetoPlayer.character.additionalJumpPower = playerAdditionalValue.additionalJumpPower;

        //sync interpolation speed
        if(this.isUseInjectSpeed){
            const ySpeed = Mathf.Abs(animationParam.FallSpeed);
            let xzSpeed : number = 0;
            if(animationParam.State == CharacterState.Jump && animationParam.JumpState == CharacterJumpState.JumpIdle){
                xzSpeed = 0;
            } else if (animationParam.MoveState == CharacterMoveState.MoveRun) {
                //1.5 : Run Weight between actual Zepeto character and Unity.
                xzSpeed = this.zepetoPlayer.character.RunSpeed * 1.5 * animationParam.Acceleration;
            } else if (animationParam.MoveState == CharacterMoveState.MoveWalk) {
                //1.25 : Walk Weight between actual Zepeto character and Unity.
                xzSpeed = this.zepetoPlayer.character.WalkSpeed * 1.25 * animationParam.Acceleration;
            } else
                return;
            
            this.tfHelper.moveSpeed = xzSpeed + ySpeed;
        }
    }
    
    //The character's animation synchronization and location synchronization do not occur at the same time, so teleport is executed after a certain frame.
    private * WaitTeleportFrame(waitFrame:number){
        for(let i=0; i<waitFrame; i++)
            yield new WaitForEndOfFrame();
        this.tfHelper.ForceTarget();
    }

    //isLocal(When it's my character)
    private * SendLocalPlayer(tick: number) {
        const pastIdleCountMax:number = 10;
        let pastIdleCount:number = 0;
        const cam = ZepetoPlayers.instance.ZepetoCamera.camera;
        const _cameraCon = cam.gameObject.GetComponent<CameraManager>();
        if(!_cameraCon) cam.gameObject.AddComponent<CameraManager>();
        
        while(true) {
            /* Update Player Data */
            GameManager.instance.PlayerDataUpdate();

            const state = this._animator.GetInteger(Anim.State);
            // Idle status is sent only once.
            const idleChecker = state != CharacterState.Idle || pastIdleCount < pastIdleCountMax;
            const onSamdasuStateChange = this.onSamdasuStateChange();

            /* Animation Data Processing */
            if(idleChecker || onSamdasuStateChange) {
                const data = new RoomData();
                const animationParam = new RoomData();
                animationParam.Add(Anim.State, state);
                animationParam.Add(Anim.MoveState, this._animator.GetInteger(Anim.MoveState));
                animationParam.Add(Anim.JumpState, this._animator.GetInteger(Anim.JumpState));
                animationParam.Add(Anim.LandingState, this._animator.GetInteger(Anim.LandingState));
                animationParam.Add(Anim.MotionSpeed, this._animator.GetFloat(Anim.MotionSpeed));
                animationParam.Add(Anim.FallSpeed, this._animator.GetFloat(Anim.FallSpeed));
                animationParam.Add(Anim.Acceleration, this._animator.GetFloat(Anim.Acceleration));
                animationParam.Add(Anim.MoveProgress, this._animator.GetFloat(Anim.MoveProgress));
                animationParam.Add(Anim.isSit, this._animator.GetBool(Anim.isSit));
                animationParam.Add(Anim.isHold, this._animator.GetBool(Anim.isHold));
                animationParam.Add(Anim.SamdasuState, this._animator.GetInteger(Anim.SamdasuState));
                data.Add(SendName.animationParam, animationParam.GetObject());

                data.Add(SendName.gestureName, this._animator.runtimeAnimatorController.animationClips[1].name ?? null);
                
                const playerAdditionalValue = new RoomData();
                playerAdditionalValue.Add(PlayerMove.additionalWalkSpeed, this.zepetoPlayer.character.additionalWalkSpeed);
                playerAdditionalValue.Add(PlayerMove.additionalRunSpeed, this.zepetoPlayer.character.additionalRunSpeed);
                playerAdditionalValue.Add(PlayerMove.additionalJumpPower, this.zepetoPlayer.character.additionalJumpPower);
                data.Add(SendName.playerAdditionalValue, playerAdditionalValue.GetObject());

                this._room?.Send(MESSAGE.SyncPlayer, data.GetObject());
            }

            this.prevSamdasuState = this._animator.GetInteger(Anim.SamdasuState);

            if(state == CharacterState.Idle)             //Send 10 more frames even if stopped
                pastIdleCount++;
            else
                pastIdleCount = 0;
                
            yield new WaitForSeconds(tick);
        }
    }

    /* On SamdasuState Change  */
    private onSamdasuStateChange() {
        if(this._animator) return this.prevSamdasuState != this._animator.GetInteger(Anim.SamdasuState);
        else return false;
    }
}
