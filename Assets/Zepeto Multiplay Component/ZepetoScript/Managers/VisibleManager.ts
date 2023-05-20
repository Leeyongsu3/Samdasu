import { GameObject, Transform } from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class VisibleManager extends ZepetoScriptBehaviour {

    /* Properties */
    @SerializeField() private visibleZones: Transform;
    private visibleTargets: GameObject[] = [];

    /* Game Manager */
    public RemoteStart() {
        for(let i=0; i<this.visibleZones.childCount; i++) {
            const zone = this.visibleZones.GetChild(i);
            const target = zone.GetChild(2);
            target.name = `${target.name}_${i}`;
            this.visibleTargets.push(target.gameObject);
            target.gameObject.SetActive(false);
        }
    }

    /* Visibler Script */
    public VisibleTarget(targetName:string) { this.TargetControl(targetName, true); }
    public InvisibleTarget(targetName:string) { this.TargetControl(targetName, false); }

    /* Main Script */
    public TargetControl(targetName:string, isVisible:boolean) {
        for(const target of this.visibleTargets) {
            if(target.name == targetName) {
                target.SetActive(isVisible);
                return true;
            }
        }
        return false;
    }
}