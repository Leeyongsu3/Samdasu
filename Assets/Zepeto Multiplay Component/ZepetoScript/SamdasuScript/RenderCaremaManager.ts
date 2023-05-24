import { Camera, GameObject, Input, LayerMask, Mathf, Physics, RaycastHit, Transform, Vector2, Vector3, WaitForSeconds } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import { Datas } from '../Managers/TypeManager';
import RenderCameraController from './RenderCameraController';

export default class RenderCaremaManager extends ZepetoScriptBehaviour {

    /* Default Property */
    public multiplay:ZepetoWorldMultiplay;

    /* Camera Property */
    private layer_rnd:number;
    private layer_Frame:number;
    private renderCamera:Camera;
    private isHold:boolean = false;
    private wait:WaitForSeconds;
    private _touchItem: Transform;
    public get touchItem(): Transform { return this._touchItem; }
    private set touchItem(value: Transform) {
        this._touchItem = value;
        console.log(` touchItem Update : ${value} `);
        this.renderCameraController.SetTouchItem(value?.gameObject);
    }
    private touchPoint:Vector3;

    @SerializeField() private _renderCameraController: Transform;
    private renderCameraController: RenderCameraController;

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();

        this.layer_Frame = 1 << LayerMask.NameToLayer(Datas.Render_Frame); // Layer 8
        this.layer_rnd = 1 << LayerMask.NameToLayer(Datas.Render_Item); // Layer 7
        this.wait = new WaitForSeconds(0.04);

        /* Set Manager */
        const renderCameraController = this._renderCameraController.GetComponent<RenderCameraController>();
        if(renderCameraController) this.renderCameraController = renderCameraController;
        else this.renderCameraController = this.GetComponentInChildren<RenderCameraController>();
        this._renderCameraController = null;
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

            /* Touch Start */
            if(Input.GetMouseButtonDown(0) && this.isHold == false) {
                console.log(`Render Down`);

                const ray = this.renderCamera.ScreenPointToRay(Input.mousePosition);
                const hitInfo = $ref<RaycastHit>();
                if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_rnd)) {
                    console.log(`Render Down SphereCast`);
                    this.touchItem = hitInfo.value.transform;
                    this.touchPoint = new Vector3(hitInfo.value.point.x, hitInfo.value.point.y, 3);
                    this.isHold = true;
                }

            /* Touch Drag */
            } else if(Input.GetMouseButton(0) && this.isHold == true) {
                console.log(`Render ---`);
                const ray = this.renderCamera.ScreenPointToRay(Input.mousePosition);
                const hitInfo = $ref<RaycastHit>();
                if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_Frame)) {
                    console.log(`Render --- SphereCast`);
                    this.touchPoint = new Vector3(hitInfo.value.point.x, hitInfo.value.point.y, hitInfo.value.point.z);
                    this.touchItem.position = this.touchPoint;
                }
                
            /* Touch End */
            } else if(Input.GetMouseButtonUp(0) && this.isHold == true) {
                console.log(`Render UP`);

                /* TEST */
                const ray = this.renderCamera.ScreenPointToRay(Input.mousePosition);
                const hitInfo = $ref<RaycastHit>();
                if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_Frame)) {
                    console.log(`Render UP SphereCast`);
                    this.touchPoint = new Vector3(hitInfo.value.point.x, hitInfo.value.point.y, hitInfo.value.point.z);
                    this.touchItem.position = this.touchPoint;
                }
                this.isHold = false;
            }
        }
    }
}