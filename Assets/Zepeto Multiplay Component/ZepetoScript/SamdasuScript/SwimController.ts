import { Collider } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameManager from '../Managers/GameManager';
import { SamdasuState } from '../Managers/TypeManager';

export default class SwimController extends ZepetoScriptBehaviour {
    
    OnTriggerEnter(collider : Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return;
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            GameManager.instance.SetSamdasuState(SamdasuState.Swim, true);
        }
    }
    
    OnTriggerExit(collider : Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return;
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            GameManager.instance.SetSamdasuState(SamdasuState.Swim, false);
        }
    }

}