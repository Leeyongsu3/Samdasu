import { Camera, GameObject, Mathf, Quaternion, RenderTexture, Sprite, Transform, Vector3, WaitForEndOfFrame, YieldInstruction } from 'UnityEngine';
import { Button, Image, Slider, Text } from 'UnityEngine.UI';
import { UIZepetoPlayerControl, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldContent } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from '../Managers/GameManager';
import { ButtonInfo, RenderPhotoMode, StampType, TOAST_MESSAGE, RenderItemData, ERROR, Language } from '../Managers/TypeManager';

export default class RenderCameraController extends ZepetoScriptBehaviour {

    /* Controller Properties */
    @Header("Init Field")
    @SerializeField() private stickerPool: Transform;

    @Header("Default Mode")
    @SerializeField() private mainCanvas: GameObject;
    @SerializeField() private screenShotPrefab: GameObject;

    @Header("Edit Mode")
    @SerializeField() private renderEditCamera: Camera;
    @SerializeField() private editCanvas: GameObject;
    @SerializeField() private editRenderCanvas: GameObject;
    @SerializeField() private stickerPrefabs: GameObject[] = [];
    private stickerButtonInfos: ButtonInfo[] = [];
    private RenderItemDatas: RenderItemData[] = [];
    private touchItemData: RenderItemData;
    private scaleSlider: Slider;
    private rotSlider: Slider;
    
    @Header("Result Mode")
    @SerializeField() private renderTextureCamera: Camera;
    @SerializeField() private renderTexture: RenderTexture;
    @SerializeField() private resultCanvas: GameObject;
    @SerializeField() private feedMessage: string;
    @SerializeField() private toastSuccessMessage: GameObject;
    @SerializeField() private toastErrorMessage: GameObject;

    @Header("Localizing")
    @SerializeField() private krPhotoLogoImage: Sprite;
    @SerializeField() private enPhotoLogoImage: Sprite;
    private photoLogoImage: Image;
    
    private renderState: RenderPhotoMode = RenderPhotoMode.Default;
    private controller: GameObject;
    private isFirst: boolean = false;
    private wait: YieldInstruction;

    /* GameManager */
    public RemoteStart() {
        this.stickerPool.gameObject.SetActive(false);

        /* Set UI Init */
        this.SetTextureCanvas();
        this.SetEditCanvas();
    }

    /* GameManager */
    public RenderPhotoModeChangeToEdit() {
        if(this.renderState != RenderPhotoMode.Edit_Mode) this.RenderPhotoModeChanger(RenderPhotoMode.Edit_Mode);
    }

    /* Render Mode Changer */
    private RenderPhotoModeChanger(renderChange:RenderPhotoMode) {
        switch(+renderChange) {
            case RenderPhotoMode.Edit_Mode:
                console.log(` Edit_Mode 1 `);
                ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(false);
                console.log(` Edit_Mode 2 `);
                this.renderEditCamera.gameObject.SetActive(true);
                console.log(` Edit_Mode 3 `);
                this.mainCanvas.SetActive(false);
                console.log(` Edit_Mode 4 `);
                this.editCanvas.SetActive(true);
                console.log(` Edit_Mode 5 `);
                this.resultCanvas.SetActive(false);
                console.log(` Edit_Mode 6 `);
                this.ControllerSet(false);
                console.log(` Edit_Mode 7 `);
                this.InfoDataUpdate();
                console.log(` Edit_Mode 8 `);
                this.Localizing();
                console.log(` Edit_Mode 9 `);
                break;

            case RenderPhotoMode.Result_Mode:
                console.log(` Result_Mode 1 `);
                ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(false);
                console.log(` Result_Mode 2 `);
                this.renderEditCamera.gameObject.SetActive(true);
                console.log(` Result_Mode 3 `);
                this.TakeStickerScreen();
                console.log(` Result_Mode 4 `);
                this.mainCanvas.SetActive(false);
                console.log(` Result_Mode 5 `);
                this.editCanvas.SetActive(false);
                console.log(` Result_Mode 6 `);
                this.resultCanvas.SetActive(true);
                console.log(` Result_Mode 7 `);
                this.ControllerSet(false);
                console.log(` Result_Mode 8 `);
                this.InfoDataUpdate();
                console.log(` Result_Mode 9 `);
                break;
                
            default: // to Default
                console.log(` default 1 `);
                ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(true);
                console.log(` default 2 `);
                this.renderEditCamera.gameObject.SetActive(false);
                console.log(` default 3 `);
                this.mainCanvas.SetActive(true);
                console.log(` default 4 `);
                this.editCanvas.SetActive(false);
                console.log(` default 5 `);
                this.resultCanvas.SetActive(false);
                console.log(` default 6 `);
                this.ControllerSet(true);
                console.log(` default 7 `);
                this.InfoDataUpdate();
                console.log(` default 8 `);
                this.ReturnAllInstantiateSticker();
                console.log(` default 9 `);
                this.renderState = RenderPhotoMode.Default;
                console.log(` default 0 `);
                break;
        }
    }

    /* Set Texture Canvas */
    private SetTextureCanvas() {
        /* Buttons */
        const resultPanel = this.resultCanvas.transform.GetChild(1);
        const saveButton = resultPanel.GetChild(0).GetChild(0).GetComponent<Button>();
        const shareButton = resultPanel.GetChild(0).GetChild(1).GetComponent<Button>();
        const feedButton = resultPanel.GetChild(0).GetChild(2).GetComponent<Button>();
        const exitButton = resultPanel.GetChild(1).GetComponent<Button>();
        // const returnButton = resultPanel.GetChild(2).GetComponent<Button>();

        /* Button Scripts */
        saveButton.onClick.AddListener(() => {
            ZepetoWorldContent.SaveToCameraRoll(this.renderTexture, (result: boolean) => { console.log(`${result}`) });
            this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.screenShotSaveCompleted));
        });

        shareButton.onClick.AddListener(() => {
            ZepetoWorldContent.Share(this.renderTexture, (result: boolean) => { console.log(`${result}`) });
        });

        feedButton.onClick.AddListener(() => {
            ZepetoWorldContent.CreateFeed(this.renderTexture, this.feedMessage, (result: boolean) => {
                if (result) {
                    feedButton.gameObject.SetActive(false);
                    this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedCompleted));
                } else {
                    this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedFailed));
                }
            });
            this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedUploading));
        });

        exitButton.onClick.AddListener(() => {
            this.RenderPhotoModeChanger(RenderPhotoMode.Default);
            this.SetTouchItem(null);
        });

        // returnButton.onClick.AddListener(() => {
        //     this.RenderPhotoModeChanger(RenderPhotoMode.Edit_Mode);
        // });
    }

    /* Set Edit Canvas */
    private SetEditCanvas() {
        const closeButton = this.editCanvas.transform.GetChild(0).GetComponent<Button>();
        const buttonPanel = this.editCanvas.transform.GetChild(1);
        const controlPanel = this.editCanvas.transform.GetChild(2);
        const controlSliderPanel = this.editCanvas.transform.GetChild(3);
        this.photoLogoImage = this.editCanvas.transform.GetChild(4).GetComponent<Image>();

        /* Buttons */
        const renderButton = controlPanel.GetChild(0).GetComponent<Button>();
        const clearButton = controlPanel.GetChild(1).GetComponent<Button>();
        const resetButton = controlPanel.GetChild(2).GetComponent<Button>();
        const removeButton = controlPanel.GetChild(3).GetComponent<Button>();
        const releaseButton = controlPanel.GetChild(4).GetComponent<Button>();

        /* Button Scripts */
        closeButton.onClick.AddListener(() => {
            this.RenderPhotoModeChanger(RenderPhotoMode.Default);
            this.SetTouchItem(null);
        });

        renderButton.onClick.AddListener(() => {
            this.RenderPhotoModeChanger(RenderPhotoMode.Result_Mode);
        });

        clearButton.onClick.AddListener(() => {
            this.ReturnAllInstantiateSticker();
            this.SetTouchItem(null);
        });

        resetButton.onClick.AddListener(() => {
            if(this.touchItemData) {
                this.touchItemData.transform.rotation = Quaternion.identity;
                this.touchItemData.transform.localScale = Vector3.one;
                this.touchItemData.scale_suporter = 1;
                this.touchItemData.rot_suporter = 0;
                this.scaleSlider.value = 1;
                this.rotSlider.value = 0;
            }
        });

        removeButton.onClick.AddListener(() => {
            if(this.touchItemData) this.ReturnInstantiateSticker(this.touchItemData);
        });

        releaseButton.onClick.AddListener(() => {
            this.SetTouchItem(null);
        });

        /* Sliders */
        this.scaleSlider = controlSliderPanel.GetChild(0).GetComponent<Slider>();
        this.rotSlider = controlSliderPanel.GetChild(1).GetComponent<Slider>();

        /* Connect Slider */
        this.rotSlider.onValueChanged.AddListener( () => this.RotationChange());
        this.scaleSlider.onValueChanged.AddListener( () => this.ScaleChange() );

        /* Set Sticker Button Panel */
        this.SetStickerPanel(buttonPanel);
    }

    /* Set Sticker Button Panel */
    private SetStickerPanel(buttonPanel:Transform) {
        /* Set Sticker Button */
        for(let i=0; i<buttonPanel.childCount; i++) {
            const btn = buttonPanel.GetChild(i).GetComponent<Button>();
            const info:ButtonInfo = {
                button:btn,
                count:0,
                countText:btn.transform.GetChild(0).GetChild(0).GetComponent<Text>(),
                countImage:btn.transform.GetChild(0).GetComponent<Image>(),
                instances:[],
            };
            this.stickerButtonInfos.push(info);

            const prefab = this.FindMatchButton(btn.name);
            btn.onClick.AddListener(() => this.GetStickerObject(prefab, info));
        }
        this.stickerPrefabs = [];
    }
    private FindMatchButton(buttonName:string) {
        for(const prefab of this.stickerPrefabs) {
            if(buttonName == prefab.name) {
                return prefab;
            }
        }
        return null;
    }

    /* Toast */
    private * ShowToastMessage(text: string) {
        const resultPanel = this.resultCanvas.transform.GetChild(1);
        yield this.wait;

        const originObject = text == TOAST_MESSAGE.feedFailed ? this.toastErrorMessage : this.toastSuccessMessage;
        const toastMessage = GameObject.Instantiate<GameObject>(originObject);
        toastMessage.transform.SetParent(resultPanel);
        toastMessage.GetComponentInChildren<Text>().text = text;
        GameObject.Destroy(toastMessage, 1);
    }

    /* Sticker Screen Shot */
    private TakeStickerScreen() {
        this.renderTextureCamera.gameObject.SetActive(true);
        this.renderTextureCamera.targetTexture = this.renderTexture;

        /* Camera Render */
        this.StartCoroutine(this.CameraRender());
    }
    private * CameraRender() {
        // this.renderTextureCamera.orthographi

        yield new WaitForEndOfFrame();
        this.renderTextureCamera.Render();
        this.renderTextureCamera.targetTexture = null;
        this.renderTextureCamera.gameObject.SetActive(false);

        GameManager.instance.ClearStampMission(StampType.STAMP_STICKER);
        /* Camera Render END */
        this.StopCoroutine(this.CameraRender());
    }

    /* Change Language */
    private Localizing() {
        if(SyncIndexManager.language == Language.KR) {
            this.photoLogoImage.sprite = this.krPhotoLogoImage;

        } else if(SyncIndexManager.language == Language.EN) {
            this.photoLogoImage.sprite = this.enPhotoLogoImage;
        }
    }

    /* Controller Set */
    private ControllerSet(controlable:boolean) {
        if(!this.controller) {
            const controller = ZepetoPlayers.instance.gameObject.GetComponentInChildren<UIZepetoPlayerControl>();
            this.controller = controller.gameObject;
        }
        this.controller.gameObject.SetActive(controlable);
        if(controlable) {
            ZepetoPlayers.instance.controllerData.inputAsset.Enable();
            // this.controller.gameObject.SetActive(controlable);
        } else {
            ZepetoPlayers.instance.controllerData.inputAsset.Disable();
            // this.controller.gameObject.SetActive(controlable);
        }
        if(this.screenShotPrefab) this.screenShotPrefab.SetActive(controlable);
    }

    /* Get Find Button Info */
    private GetFindButtonInfo(item:GameObject) {
        for(const info of this.stickerButtonInfos) {
            if(info.button.name == item.name) {
                return info;
            }
        }
        return null;
    }

    /* Get Find Sticker Object */
    private GetStickerObject(item:GameObject, info:ButtonInfo) {
        if(!(info.count > 0) || !(this.StringToNumber(info.countText.text) > 0)) return;
        for(const instance of info.instances) {
            if(instance.transform.parent != this.stickerPool) continue;

            /* Bring Up Sticker Object */
            const editCanvas = this.editRenderCanvas.transform;
            instance.transform.position = new Vector3(editCanvas.position.x, editCanvas.position.y, 3);
            instance.transform.rotation = Quaternion.identity;
            instance.transform.parent = editCanvas;
            instance.SetActive(true);

            /* Button Count Update */
            info.countText.text = `${Mathf.Clamp(this.StringToNumber(info.countText.text)-1, 0, info.count)}`;
            return;
        }
        this.InstantiateSticker(item, info);
    }

    /* Instantiate Sticker */
    private InstantiateSticker(item:GameObject, info:ButtonInfo) {
        if(!(info.count > 0)) return;

        /* Wood of the Samdasu */
        if(!this.isFirst) {
            this.isFirst = true;
            GameManager.instance.onCreateStickerObject();
        }

        /* Instante Sticker Object */
        const editCanvas = this.editRenderCanvas.transform;
        const clone = GameObject.Instantiate(item, editCanvas) as GameObject;
        info.instances.push(clone);
        clone.name = info.button.name;
        clone.transform.position = new Vector3(editCanvas.position.x, editCanvas.position.y, 3);
        clone.transform.rotation = Quaternion.identity;
        clone.transform.localScale = Vector3.one;
        clone.SetActive(true);

        /* Button Count Update */
        info.countText.text = `${Mathf.Clamp(this.StringToNumber(info.countText.text)-1, 0, info.count)}`;
        
        /* Set Init Render Item's Control Data */
        const renderItemData:RenderItemData = {
            gameObject:clone,
            transform:clone.transform,
            scale_suporter:1,
            rot_suporter:0,
        }
        this.RenderItemDatas.push(renderItemData);
    }

    /* Return Instantiate in pool */
    private ReturnInstantiateSticker(data:RenderItemData, info:ButtonInfo = null) {
        if(!info) info = this.GetFindButtonInfo(data.gameObject);
        for(const instance of info.instances) {
            if(data.gameObject != instance) continue;

            /* Reset Object */
            instance.transform.parent = this.stickerPool;
            instance.transform.position = this.stickerPool.position;
            instance.transform.rotation = Quaternion.identity;
            instance.transform.localScale = Vector3.one;
            instance.SetActive(false);

            /* Button Count Update */
            info.countText.text = `${Mathf.Clamp(this.StringToNumber(info.countText.text)+1, 0, info.count)}`;

            /* Reset TouchItem Value */
            data.scale_suporter = 1;
            data.rot_suporter = 0;
            this.SetTouchItem(null);
            return;
        }
    }

    /* Return All Instantiate in pool */
    private ReturnAllInstantiateSticker() {
        /* Button Reset */
        for(const info of this.stickerButtonInfos) {
            for(const instance of info.instances) {
                if(instance.transform.parent != this.stickerPool) {
                    instance.transform.parent = this.stickerPool;
                    instance.transform.position = this.stickerPool.position;
                    instance.transform.rotation = Quaternion.identity;
                    instance.transform.localScale = Vector3.one;
                    instance.SetActive(false);
                }
            }
            info.countText.text = `${info.count}`;
        }

        /* Reset All TouchItem Datas */
        for(const data of this.RenderItemDatas) {
            data.scale_suporter = 1;
            data.rot_suporter = 0;
        }
    }

    /* Set Touch Item From RenderCameraManager */
    public SetTouchItem(item:GameObject) {
        const controlSliderPanel = this.editCanvas.transform.GetChild(3);
        if(item) {
            controlSliderPanel.gameObject.SetActive(true);
            
            const renderItemData = this.FindRenderItemData(item);
            if(!renderItemData) return console.error(ERROR.NOT_FOUND_ITEM);
            
            /* Set Slider Value */
            this.touchItemData = renderItemData;
            this.rotSlider.value = renderItemData.rot_suporter;
            this.scaleSlider.value = renderItemData.scale_suporter;

        } else {
            /* Set Slider Value Default */
            controlSliderPanel.gameObject.SetActive(false);
            this.scaleSlider.value = 1;
            this.rotSlider.value = 0;
            this.touchItemData = null;
        }
    }

    /* Get Find Render Item Data */
    private FindRenderItemData(item:GameObject) {
        for(const data of this.RenderItemDatas) {
            if(data.gameObject == item) {
                return data;
            }
        }
        return null;
    }

    /* Remote Set Touch Item */
    private ScaleChange() {
        if(!this.touchItemData) return console.error(ERROR.NOT_FOUND_ITEM);

        const scale = Vector3.one * this.scaleSlider.value;
        scale.z = 1;
        this.touchItemData.transform.localScale = scale;
        this.touchItemData.scale_suporter = this.scaleSlider.value;
    }
    private RotationChange() {
        if(!this.touchItemData) return console.error(ERROR.NOT_FOUND_ITEM);

        this.touchItemData.transform.rotation = Quaternion.Euler(0, 0, this.rotSlider.value);
        this.touchItemData.rot_suporter = this.rotSlider.value;
    }

    /* Sticker Count Update */
    private InfoDataUpdate() {
        for(const info of this.stickerButtonInfos) {
            if(SyncIndexManager.STICKERS.has(info.button.name)) {
                const sticker = SyncIndexManager.STICKERS.get(info.button.name);
                info.count = sticker.count;
            }
        }
    }

    /* Function String ===> Number */
    private StringToNumber(num:string) {
        return parseInt(num) as number;
    }
}