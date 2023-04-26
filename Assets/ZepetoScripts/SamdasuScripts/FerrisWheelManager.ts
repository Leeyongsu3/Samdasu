import { Animator, Quaternion, Time, Transform, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import TransformSyncHelper from '../MultiplaySync/Transform/TransformSyncHelper';

export default class FerrisWheelManager extends ZepetoScriptBehaviour {

    /* Ferris Wheel Property */
    @SerializeField() private rotateSpeed:number = 5;
    private cages: Transform[] = Array<Transform>();
    private isCageSet: boolean = false;

    /* Default Property */
    private m_tfHelper:TransformSyncHelper;
    
    private Start() {
        /* Default Init */
        this.m_tfHelper = this.GetComponent<TransformSyncHelper>();
        this.m_tfHelper.rotateSpeed = this.rotateSpeed;

        /* Ferris Wheel Init */
        for(const trans of this.GetComponentsInChildren<Transform>()) {
            if(trans.name == "cabin") {
                this.cages.push(trans);
                this.isCageSet = true;
            }
        }
    }

    private Update() {
        /* Ferris Wheel Cage Rotation Lock */
        if(this.isCageSet) {
            for(const cage of this.cages) {
                cage.eulerAngles = new Vector3(-90, 90, 0);
            }
        }

        /* Ferris Wheel Body Rotate */
        if(!this.m_tfHelper.isOwner) return;
        const z = (this.rotateSpeed * Time.deltaTime) % 360;
        this.transform.eulerAngles = new Vector3(
            this.transform.rotation.eulerAngles.x,
            this.transform.rotation.eulerAngles.y,
            this.transform.rotation.eulerAngles.z + z);
    }
}