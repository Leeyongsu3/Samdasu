import {Collider, Vector3, Quaternion, Transform, GameObject} from 'UnityEngine';
import { SpawnInfo, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import ZepetoPlayersManager from '../Player/ZepetoPlayersManager';

export default class FallChecking extends ZepetoScriptBehaviour {
    //It's a script that responds when the Zepeto character falls.
    
    private OnTriggerEnter(coll: Collider) {
        if(coll != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) return;

        const localCharacter = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character;
        localCharacter.Teleport(ZepetoPlayersManager.instance.spawnPoint.position, ZepetoPlayersManager.instance.spawnPoint.rotation);
    }
}