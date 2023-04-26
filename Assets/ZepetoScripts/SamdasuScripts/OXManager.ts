import { GameObject, Transform } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import OXController from './OXController';

export default class OXManager extends ZepetoScriptBehaviour {

    /* Managers Properties */
    private controllers:OXController[] = [];
    
    /* Default Properties */
    private multiplay: ZepetoWorldMultiplay;
    private room: Room;

    Start() {
        this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;
        }
        for(const trans of this.transform.GetComponentsInChildren<Transform>()) {
            const con = trans.GetComponent<OXController>();
            if(con) {
                this.controllers.push(con);
            }
        }
    }

    /* Controller Call */
    public MissionFailed() {
        // console.log(`MissionFailed`);
        for(const cont of this.controllers) {
            cont.SetBlock(true);
        }
        const player = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character;
        player.Teleport(this.transform.position, this.transform.rotation);
    }
}