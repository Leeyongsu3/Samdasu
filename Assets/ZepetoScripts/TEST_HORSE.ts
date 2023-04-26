import { Animator, BoxCollider, Camera, GameObject, HumanBodyBones, Quaternion, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoPlayer, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import { Player } from 'ZEPETO.Multiplay.Schema';

export default class TEST_HORSE extends ZepetoScriptBehaviour {

    /* Default Properties */
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;
    private player:ZepetoPlayer = null;
    private m_animator: Animator;
    private h_animator: Animator;

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();
        
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;
        }
        this.StartCoroutine(this.StartLoading());
    }

    /* Start Loading */
    private * StartLoading()
    {
        const wait = new WaitForSeconds(2);
        while (true) {
            yield wait;
            if (this.room != null && this.room.IsConnected) {
                if (ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) {
                    this.player = ZepetoPlayers.instance.GetPlayer(this.room.SessionId);
                    this.m_animator = this.player.character.transform.GetComponentInChildren<Animator>();
                    this.h_animator = this.transform.GetComponent<Animator>();
                    this.StopCoroutine(this.StartLoading());
                    break;
                }
            }
        }
    }

    Update() {
        if(this.player) {
            const trans = this.player.character.transform;
            this.transform.position = new Vector3(trans.position.x, trans.position.y, trans.position.z);
            this.transform.rotation = trans.rotation;
            this.h_animator.SetInteger("State", this.m_animator.GetInteger("State"));
            console.log(this.h_animator.GetInteger("State"));
            
        }
    }

}