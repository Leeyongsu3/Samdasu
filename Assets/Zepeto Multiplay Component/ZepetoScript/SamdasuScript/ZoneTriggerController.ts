import { Collider, GameObject, ParticleSystem, WaitForSeconds } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameManager from '../Managers/GameManager';

export default class ZoneTriggerController extends ZepetoScriptBehaviour {

    /* Properties */
    private particleSystemObjects: GameObject[];
    private isEffectPlay: boolean = false;
    private wait3Sec: WaitForSeconds;
    private wait: WaitForSeconds;

    /* GameManager */
    public RemoteStart() {
        const first = this.transform.GetChild(0).gameObject;
        const second = this.transform.GetChild(1).gameObject;
        const third = this.transform.GetChild(2).gameObject;
        this.particleSystemObjects = [first, second, third];
        for(const item of this.particleSystemObjects) {
            item.SetActive(false);
        }
    }

    OnTriggerEnter(collider : Collider) {
        if(!ZepetoPlayers.instance.LocalPlayer) return;
        
        const character = ZepetoPlayers.instance.LocalPlayer.zepetoPlayer.character.gameObject;
        if(collider.gameObject == character) {
            GameManager.instance.onTriggerFirework();
        }
    }

    /* GameManager */
    public PlayEffect() { this.StartCoroutine(this.OnPlayEffect()); }
    private * OnPlayEffect() {
        if(this.isEffectPlay) return;
        this.isEffectPlay = true;

        if(!this.wait) this.wait = new WaitForSeconds(0.3);
        if(!this.wait3Sec) this.wait3Sec = new WaitForSeconds(3);

        /* Play Effects */
        for(const item of this.particleSystemObjects) {
            item.SetActive(true);
            for(let i=0; i<item.transform.childCount; i++) {
                const particle = item.transform.GetChild(i).GetComponent<ParticleSystem>();
                particle.Play();
            }
            yield this.wait;
        }
        
        /* Stop Effects */
        yield this.wait3Sec;
        for(const item of this.particleSystemObjects) {
            item.SetActive(false);
        }
        this.isEffectPlay = false;
    }
}