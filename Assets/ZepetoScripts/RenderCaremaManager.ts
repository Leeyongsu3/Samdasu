import { Camera, GameObject, Input, LayerMask, Mathf, Physics, RaycastHit, Transform, Vector2, Vector3, WaitForSeconds } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import RenderItemMove from './RenderItemMove';

export default class RenderCaremaManager extends ZepetoScriptBehaviour {

    /* Default Property */
    public multiplay:ZepetoWorldMultiplay;

    /* Camera Property */
    private layer_rnd:number;
    private layer_Frame:number;
    private renderCamera:Camera;
    private isHold:boolean = false;
    private wait:WaitForSeconds;
    private touchItem:Transform;
    private touchPoint:Vector3;

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();

        this.layer_rnd = 1 << LayerMask.NameToLayer("Render Item");
        this.layer_Frame = 1 << LayerMask.NameToLayer("Render Frame");
        this.wait = new WaitForSeconds(0.04);
    }

    /* Raycasting */
    Update() {
        if (this.multiplay.Room != null && this.multiplay.Room.IsConnected) {
            const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.multiplay.Room.SessionId);
            if (hasPlayer) {
                this.Rendercasting();
            }
        }
    }

    Rendercasting() {
        if(!this.renderCamera) {
            this.renderCamera = this.GetComponent<Camera>();
        }
        if(this.renderCamera && this.renderCamera.gameObject.activeSelf) {
            // if(Input.GetMouseButton(0)) {
            //     const ray = this.renderCamera.ScreenPointToRay(Input.mousePosition);
            //     const hitInfo = $ref<RaycastHit>();
            //     if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_rnd)) {
            //         console.log(`${hitInfo.value.transform.name} ${hitInfo.value.transform.gameObject.layer} ${this.layer_rnd}`);
            //         const renderItem = hitInfo.value.transform;
            //         renderItem.position = new Vector3(hitInfo.value.point.x, hitInfo.value.point.y, renderItem.position.z);
            //     }
            // }
            if(Input.GetMouseButtonDown(0) && this.isHold == false) {
                const ray = this.renderCamera.ScreenPointToRay(Input.mousePosition);
                const hitInfo = $ref<RaycastHit>();
                if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_rnd)) {
                    // console.log(`${hitInfo.value.transform.name} ${hitInfo.value.transform.gameObject.layer} ${this.layer_rnd}`);
                    this.touchItem = hitInfo.value.transform;
                    this.touchPoint = new Vector3(hitInfo.value.point.x, hitInfo.value.point.y, this.touchItem.position.z);
                    this.StartCoroutine(this.ChasingYourTouch());
                }
            } else if(Input.GetMouseButton(0) && this.isHold == true) {
                const ray = this.renderCamera.ScreenPointToRay(Input.mousePosition);
                const hitInfo = $ref<RaycastHit>();
                if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_Frame)) {
                    this.touchPoint = new Vector3(hitInfo.value.point.x, hitInfo.value.point.y, this.touchItem.position.z);
                }
                
            } else if(Input.GetMouseButtonUp(0) && this.isHold == true) {
                // console.log(`this.isHold = false`);
                this.isHold = false;
            }
        }
    }

    private * ChasingYourTouch() {
        if(this.isHold == true) return;
        this.isHold = true;

        while(this.isHold) {
            yield this.wait;
            // console.log(`is Hold`);
            this.touchItem.position = this.touchPoint;
        }
        this.StopCoroutine(this.ChasingYourTouch());
    }

}