import { ArraySchema } from 'types/ArraySchema';
import { GameObject, RectTransform, Sprite, Transform } from 'UnityEngine';
import { Button, Image, Text } from 'UnityEngine.UI';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import LookAt from '../Sample Code/LookAt';
import GameManager from './GameManager';
import { Datas, LoadingType, Stamp, StampUI, StampType, Sticker, StickerSelected, StickerUI, MESSAGE, StickerType, SendName, ERROR, Language } from './TypeManager';

export default class UIManager extends ZepetoScriptBehaviour {

    /* Singleton */
    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        if (this._instance === null) {
            this._instance = GameObject.FindObjectOfType<UIManager>();
            if (this._instance === null) {
                this._instance = new GameObject(UIManager.name).AddComponent<UIManager>();
            }
        }
        return this._instance;
    }

    /* UIManagers Default Properties */
    @Header("UI Manager Field")
    @SerializeField() public canvas: GameObject;
    private isPlaying: boolean;
    private isLoading: boolean;
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;
    private _openUI: GameObject;
    public get openUI(): GameObject { return this._openUI; }
    public set openUI(value: GameObject) { this._openUI = value; }
    
    /* Samdasu Property */
    @Header("* Samdasu Field")
    @Header("All range")
    @SerializeField() private trashCountText: Text;
    @SerializeField() private trashScoreText: Text;
    @SerializeField() private buttonPanel: Transform;
    @SerializeField() private cameraChangeButton: Button;
    
    @Header("Stamps UIs")
    @SerializeField() private stampUI: Transform;

    @Header("Stickers UIs")
    @SerializeField() private stickerBuyPanel: Transform;
    @SerializeField() private stickerRenderPanel: Transform;
    @SerializeField() private stickerInventoryUI: Transform;
    @SerializeField() private buyStickerUI: Transform;
    
    @Header("NPCs UIs")
    @SerializeField() private npcHello: Transform;
    @SerializeField() private npcTrashUI: Transform;
    @SerializeField() private npcHorseUI: Transform;
    @SerializeField() private npcRenderUI: Transform;
    @SerializeField() private npcInfoHanlabongUI: Transform;

    @Header("NPCs UI Open Button")
    @SerializeField() private npcHorseButtons: Transform[] = [];
    @SerializeField() private npcTrashButtons: Transform[] = [];
    @SerializeField() private npcRenderButton: Transform;
    @SerializeField() private npcInfoHanlabongButton: Transform;
    
    @Header("Change Images")
    @SerializeField() private krHelpImage: Sprite;
    @SerializeField() private enHelpImage: Sprite;
    @SerializeField() private krSureImage: Sprite;
    @SerializeField() private enSureImage: Sprite;
    @SerializeField() private krCardImage: Sprite;
    @SerializeField() private enCardImage: Sprite;
    @SerializeField() private krButtonImage: Sprite;
    @SerializeField() private enButtonImage: Sprite;
    @SerializeField() private krButtonImage_Pushed: Sprite;
    @SerializeField() private enButtonImage_Pushed: Sprite;

    private stamps:Map<string, StampUI>;
    private stickers:Map<string, StickerUI>;
    private selectedSticker:StickerSelected;

    private helpButtonImage: Image;
    private sureButtonImage: Image;
    private cardButtonImage: Image;
    private krObjects: GameObject[] = [];
    private enObjects: GameObject[] = [];
    private krButtonsImages: Image[] = [];
    private enButtonsImages: Image[] = [];

    @NonSerialized() public isHorseRide: boolean = false;
    private isAddHorse: boolean = false;

    /* Ride Controller */
    private _currentSamdasuState: string;
    public get currentSamdasuState(): string { return this._currentSamdasuState; }
    public set currentSamdasuState(value: string) {
        this._currentSamdasuState = value;
        const check = value != null && value != undefined;
        // this.buttonPanel.GetChild(0).gameObject.SetActive(check);
    }

    private Awake() {
        if (UIManager._instance !== null && UIManager._instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            UIManager._instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();
        
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;

            /* Clear One Stemp Mission */
            this.room.AddMessageHandler(MESSAGE.Clear_Stamp, (message:any) => {
                if(this.room.SessionId != message.sessionId) return;
                this.UpdateStampUI(message.sessionId, message.stamp);
            });

            /* Player Get Sticker */
            this.room.AddMessageHandler(MESSAGE.Add_Sticker, (message:any) => {
                if(!message) console.error(ERROR.NOT_ADDED_STIKERS);
                if(this.room.SessionId != message.OwnerSessionId) return;
                this.UpdateStickerUI(message.OwnerSessionId, message.Selected_A);
                this.UpdateStickerUI(message.OwnerSessionId, message.Selected_B);
            });
        }
    }

    /* From GameManager */
    public RemoteStart() {
        /* Init */
        let isFPS = false;
        if(this.cameraChangeButton) {
            this.cameraChangeButton.onClick.AddListener(() => {
                if(isFPS) GameManager.instance.SetCameraTPS();
                else GameManager.instance.SetCameraFPS();
                isFPS = !isFPS;
            })
        }

        /* Samdasu */
        this.SetHelloUI();
        this.SetTrashNPCUI();
        this.SetHorseNPCUI();
        this.SetRenderNPCUI();
        this.SetInfoHanlabongNPCUI();
        this.SetStickerInventoryUI();
        this.SetBuyPanel();
        this.SetButtonPanel();
        this.UpdatePlayerUI();
    }

    /* Get Loading Image Object */ 
    public GetLoadingImage(type:LoadingType): GameObject {
        switch(type.toString()) {
            case LoadingType.Start:
                for(let i=(this.canvas.transform.childCount-1); i>=0; i--) {
                    const ui = this.canvas.transform.GetChild(i);
                    if(ui.name == LoadingType.Start) {
                        return ui.gameObject;
                    }
                }
                return null;

            case LoadingType.Teleport:
                for(let i=(this.canvas.transform.childCount-1); i>=0; i--) {
                    const ui = this.canvas.transform.GetChild(i);
                    if(ui.name == LoadingType.Teleport) {
                        return ui.gameObject;
                    }
                }
                return null;

            default :
                return null;
        }
    }

    /* Horse Button Visibler */
    public HorseRideButtonVisibler(isVisible:boolean) {
        if(this.isAddHorse) {
            this.buttonPanel.GetChild(1).gameObject.SetActive(isVisible);
        }
    }

    /* Samdasu NPC Horse Rental UI */
    private SetHelloUI() {
        const slide_Images = this.npcHello.GetChild(0);
        const closeButton = this.npcHello.GetChild(1).GetComponent<Button>();
        const kr_Button = this.npcHello.GetChild(2).GetComponent<Button>();
        const en_Button = this.npcHello.GetChild(3).GetComponent<Button>();
        const nextButton = this.npcHello.GetChild(4).GetComponent<Button>();

        const kr = slide_Images.GetChild(0);
        const en = slide_Images.GetChild(1);

        closeButton.onClick.AddListener(() => {
            // close UI
            this.npcHello.gameObject.SetActive(false);
            index = this.ChangeSlide(-1, this.npcHello.gameObject, kr, en);
            this.openUI = null;
        });

        kr_Button.onClick.AddListener(() => {
            this.Localizing(Language.KR);
        });

        en_Button.onClick.AddListener(() => {
            this.Localizing(Language.EN);
        });

        nextButton.onClick.AddListener(() => {
            index = this.ChangeSlide(index, this.npcHello.gameObject, kr, en);
            if(index == 0) this.openUI = null;
        });

        let index = 0;
        this.npcHello.gameObject.SetActive(true);

        /* Language */
        this.krObjects.push(kr.gameObject);
        this.enObjects.push(en.gameObject);
        this.krButtonsImages.push(kr_Button.GetComponent<Image>());
        this.enButtonsImages.push(en_Button.GetComponent<Image>());
    }

    /* Samdasu NPC Trash UI */
    private SetTrashNPCUI() {
        const slide_Images = this.npcTrashUI.GetChild(0);
        const choice_Images = this.npcTrashUI.GetChild(1);
        const branch_Images = this.npcTrashUI.GetChild(2);
        const closeButton = this.npcTrashUI.GetChild(3).GetComponent<Button>();
        const kr_Button = this.npcTrashUI.GetChild(4).GetComponent<Button>();
        const en_Button = this.npcTrashUI.GetChild(5).GetComponent<Button>();
        // const nextButton = this.npcTrashUI.GetChild(6).GetComponent<Button>();
        // const pointButton = this.npcTraderUI.GetChild(2).GetComponent<Button>();
        // const stickButton = this.npcTraderUI.GetChild(3).GetComponent<Button>();

        /* First Talk */
        const kr = slide_Images.GetChild(0);
        const en = slide_Images.GetChild(1);
        const nextButton = slide_Images.GetChild(2).GetComponent<Button>();
        const helpButton = slide_Images.GetChild(3).GetComponent<Button>();

        closeButton.onClick.AddListener(() => {
            // close UI
            this.npcTrashUI.gameObject.SetActive(false);
            for(const btn of npcButtons) btn.RemoteStartLooking();
            index = this.ChangeSlide(-1, this.npcTrashUI.gameObject, kr, en);
            if(index == 0) this.openUI = null;
            
            if(!SyncIndexManager.Talk_First_Finish) {
                /* First Talk */
                slide_Images.gameObject.SetActive(true);
                choice_Images.gameObject.SetActive(false);

            } else {
                /* Choice */
                slide_Images.gameObject.SetActive(false);
                choice_Images.gameObject.SetActive(true);
            }
            /* Branch */
            createIndex = 0;
            stickerUI.gameObject.SetActive(false);
            pointUI.gameObject.SetActive(false);
            createUI.gameObject.SetActive(false);
            create_kr.GetChild(0).gameObject.SetActive(false);
            create_kr.GetChild(1).gameObject.SetActive(true);
            create_en.GetChild(0).gameObject.SetActive(false);
            create_en.GetChild(1).gameObject.SetActive(true);
        });

        kr_Button.onClick.AddListener(() => {
            this.Localizing(Language.KR);
        });

        en_Button.onClick.AddListener(() => {
            this.Localizing(Language.EN);
        });

        nextButton.onClick.AddListener(() => {
            index = this.ChangeSlide(index, this.npcTrashUI.gameObject, kr, en);
            console.log(`index : ${index}`);
            
            if(index == 1) {
                nextButton.gameObject.SetActive(false);
                helpButton.gameObject.SetActive(true);

            } else {
                nextButton.gameObject.SetActive(true);
                helpButton.gameObject.SetActive(false);
            }

            if(index == 0) {
                SyncIndexManager.Talk_First_Finish = true;
                slide_Images.gameObject.SetActive(false);
                choice_Images.gameObject.SetActive(true);
                for(const btn of npcButtons) btn.RemoteStartLooking();
                this.openUI = null;
            }
        });

        helpButton.onClick.AddListener(() => {
            index = this.ChangeSlide(index, this.npcTrashUI.gameObject, kr, en);
            nextButton.gameObject.SetActive(true);
            helpButton.gameObject.SetActive(false);
        });
        
        /* Choice UI */
        const choice_kr = choice_Images.GetChild(0);
        const choice_en = choice_Images.GetChild(1);

        const choices = [choice_kr, choice_en];
        for(const choice of choices) {
            const stickerButton = choice.GetChild(1).GetComponent<Button>();
            const pointButton = choice.GetChild(2).GetComponent<Button>();
            const createButton = choice.GetChild(3).GetComponent<Button>();

            stickerButton.onClick.AddListener(() => {
                choice_Images.gameObject.SetActive(false);
                stickerUI.gameObject.SetActive(true);
            });
    
            pointButton.onClick.AddListener(() => {
                choice_Images.gameObject.SetActive(false);
                pointUI.gameObject.SetActive(true);
            });
    
            createButton.onClick.AddListener(() => {
                choice_Images.gameObject.SetActive(false);
                createUI.gameObject.SetActive(true);
            });
        }
        
        /* Choose Branch */
        const stickerUI = branch_Images.GetChild(0);
        const pointUI = branch_Images.GetChild(1);
        const createUI = branch_Images.GetChild(2);
        
        /* Branch - Sticker UI */
        const sticker_kr = stickerUI.GetChild(0);
        const sticker_en = stickerUI.GetChild(1);
        const sticker_nextButton = stickerUI.GetChild(2).GetComponent<Button>();
        sticker_nextButton.onClick.AddListener(() => {
            this.npcTrashUI.gameObject.SetActive(false);
            choice_Images.gameObject.SetActive(true);
            stickerUI.gameObject.SetActive(false);
            this.openUI = null;
            console.log(sticker_nextButton, SyncIndexManager.TrashCount >= 10);
            
            if(SyncIndexManager.TrashCount >= 10) {
                this.buyStickerUI.gameObject.SetActive(true);
            } else {
                // NEED to UI
                for(const btn of npcButtons) btn.RemoteStartLooking();
            }
        });
        
        // /* Branch - Point UI */
        const point_kr = pointUI.GetChild(0);
        const point_en = pointUI.GetChild(1);
        const point_nextButton = pointUI.GetChild(2).GetComponent<Button>();
        point_nextButton.onClick.AddListener(() => {
            this.npcTrashUI.gameObject.SetActive(false);
            for(const btn of npcButtons) btn.RemoteStartLooking();
            choice_Images.gameObject.SetActive(true);
            pointUI.gameObject.SetActive(false);
            this.openUI = null;
            console.log(point_nextButton, SyncIndexManager.TrashCount >= 10);

            if(SyncIndexManager.TrashCount >= 10) {
                const data = new RoomData();
                data.Add(SendName.trashCount, 10);
                this.room.Send(MESSAGE.Add_Point, data.GetObject());
                GameManager.instance.ClearStampMission(StampType.STAMP_TRASH);
            } else {
                // NEED to UI
            }
        });
        
        /* Branch - Create UI */
        const create_kr = createUI.GetChild(0);
        const create_en = createUI.GetChild(1);
        const create_nextButton = createUI.GetChild(2).GetComponent<Button>();
        create_nextButton.onClick.AddListener(() => {
            console.log(create_nextButton);
            if(createIndex == 0) {
                const count = GameManager.instance.GetAliveTrashCount();
                if(count > 0) {
                    createIndex++;
                    create_kr.GetChild(0).gameObject.SetActive(false);
                    create_kr.GetChild(1).gameObject.SetActive(true);
                    create_en.GetChild(0).gameObject.SetActive(false);
                    create_en.GetChild(1).gameObject.SetActive(true);
                    return;
                } else {
                    GameManager.instance.onTrashGamePlay();
                }
            } else {
                createIndex = 0;
            }
            this.npcTrashUI.gameObject.SetActive(false);
            for(const btn of npcButtons) btn.RemoteStartLooking();
            choice_Images.gameObject.SetActive(true);
            createUI.gameObject.SetActive(false);
            this.openUI = null;
            create_kr.GetChild(0).gameObject.SetActive(true);
            create_kr.GetChild(1).gameObject.SetActive(false);
            create_en.GetChild(0).gameObject.SetActive(true);
            create_en.GetChild(1).gameObject.SetActive(false);
        });

        let index = 0;
        let createIndex = 0;
        SyncIndexManager.Talk_First_Finish = false;
        helpButton.gameObject.SetActive(false);
        stickerUI.gameObject.SetActive(false);
        pointUI.gameObject.SetActive(false);
        createUI.gameObject.SetActive(false);

        /* Language */
        this.krObjects.push(kr.gameObject);
        this.enObjects.push(en.gameObject);
        this.krObjects.push(choice_kr.gameObject);
        this.enObjects.push(choice_en.gameObject);
        this.krObjects.push(sticker_kr.gameObject);
        this.enObjects.push(sticker_en.gameObject);
        this.krObjects.push(point_kr.gameObject);
        this.enObjects.push(point_en.gameObject);
        this.krObjects.push(create_kr.gameObject);
        this.enObjects.push(create_en.gameObject);
        this.krButtonsImages.push(kr_Button.GetComponent<Image>());
        this.enButtonsImages.push(en_Button.GetComponent<Image>());
        this.helpButtonImage = helpButton.GetComponent<Image>();
        
        /* World Button */
        const npcButtons:LookAt[] = [];
        for(const button of this.npcTrashButtons) {
            const look = button.GetComponent<LookAt>();
            npcButtons.push(look);
        }
    }

    /* Samdasu NPC Horse Rental UI */
    private SetHorseNPCUI() {
        const slide_Images = this.npcHorseUI.GetChild(0);
        const closeButton = this.npcHorseUI.GetChild(1).GetComponent<Button>();
        const kr_Button = this.npcHorseUI.GetChild(2).GetComponent<Button>();
        const en_Button = this.npcHorseUI.GetChild(3).GetComponent<Button>();
        const nextButton = this.npcHorseUI.GetChild(4).GetComponent<Button>();

        const kr = slide_Images.GetChild(0);
        const en = slide_Images.GetChild(1);

        closeButton.onClick.AddListener(() => {
            // close UI
            this.npcHorseUI.gameObject.SetActive(false);
            index = this.ChangeSlide(-1, this.npcHorseUI.gameObject, kr, en);
            for(const btn of npcButtons) btn.RemoteStartLooking();
            this.openUI = null;
        });

        kr_Button.onClick.AddListener(() => {
            this.Localizing(Language.KR);
        });

        en_Button.onClick.AddListener(() => {
            this.Localizing(Language.EN);
        });

        nextButton.onClick.AddListener(() => {
            index = this.ChangeSlide(index, this.npcHorseUI.gameObject, kr, en);
            if(index == 0) {
                this.isAddHorse = true;
                this.HorseRideButtonVisibler(true);
                for(const btn of npcButtons) btn.RemoteStartLooking();
                this.openUI = null;
            }
        });

        let index = 0;

        /* Language */
        this.krObjects.push(kr.gameObject);
        this.enObjects.push(en.gameObject);
        this.krButtonsImages.push(kr_Button.GetComponent<Image>());
        this.enButtonsImages.push(en_Button.GetComponent<Image>());
        
        /* World Button */
        const npcButtons:LookAt[] = [];
        for(const button of this.npcHorseButtons) {
            const look = button.GetComponent<LookAt>();
            npcButtons.push(look);
        }
        this.npcHorseButtons = null;
    }

    /* Samdasu NPC Photo Render UI */
    private SetRenderNPCUI() {
        const slide_Images = this.npcRenderUI.GetChild(0);
        const closeButton = this.npcRenderUI.GetChild(1).GetComponent<Button>();
        const kr_Button = this.npcRenderUI.GetChild(2).GetComponent<Button>();
        const en_Button = this.npcRenderUI.GetChild(3).GetComponent<Button>();
        const nextButton = this.npcRenderUI.GetChild(4).GetComponent<Button>();
        const startButton = this.npcRenderUI.GetChild(5).GetComponent<Button>();

        const kr = slide_Images.GetChild(0);
        const en = slide_Images.GetChild(1);

        closeButton.onClick.AddListener(() => {
            // close UI
            this.npcRenderUI.gameObject.SetActive(false);
            index = this.ChangeSlide(-1, this.npcRenderUI.gameObject, kr, en);
            npcButton.RemoteStartLooking();
            this.openUI = null;
            nextButton.gameObject.SetActive(true);
            startButton.gameObject.SetActive(false);
        });

        kr_Button.onClick.AddListener(() => {
            this.Localizing(Language.KR);
        });

        en_Button.onClick.AddListener(() => {
            this.Localizing(Language.EN);
        });

        nextButton.onClick.AddListener(() => {
            index = this.ChangeSlide(index, this.npcRenderUI.gameObject, kr, en);
            nextButton.gameObject.SetActive(false);
            startButton.gameObject.SetActive(true);
            if(index == 0) this.openUI = null;
        });

        startButton.onClick.AddListener(() => {
            index = this.ChangeSlide(index, this.npcRenderUI.gameObject, kr, en);
            npcButton.RemoteStartLooking();
            GameManager.instance.RenderModeToEditMode();
            nextButton.gameObject.SetActive(true);
            startButton.gameObject.SetActive(false);
            if(index == 0) this.openUI = null;
        });

        startButton.gameObject.SetActive(false);
        let index = 0;

        /* Language */
        this.krObjects.push(kr.gameObject);
        this.enObjects.push(en.gameObject);
        this.krButtonsImages.push(kr_Button.GetComponent<Image>());
        this.enButtonsImages.push(en_Button.GetComponent<Image>());
        this.sureButtonImage = nextButton.GetComponent<Image>();
        this.cardButtonImage = startButton.GetComponent<Image>();
        
        /* World Button */
        const npcButton:LookAt = this.npcRenderButton.GetComponent<LookAt>();
        this.npcRenderButton = null;
    }

    /* Samdasu NPC Hanlabong UI */
    private SetInfoHanlabongNPCUI() {
        const slide_Images = this.npcInfoHanlabongUI.GetChild(0);
        const closeButton = this.npcInfoHanlabongUI.GetChild(1).GetComponent<Button>();
        const kr_Button = this.npcInfoHanlabongUI.GetChild(2).GetComponent<Button>();
        const en_Button = this.npcInfoHanlabongUI.GetChild(3).GetComponent<Button>();
        const nextButton = this.npcInfoHanlabongUI.GetChild(4).GetComponent<Button>();

        const kr = slide_Images.GetChild(0);
        const en = slide_Images.GetChild(1);

        closeButton.onClick.AddListener(() => {
            // close UI
            this.npcInfoHanlabongUI.gameObject.SetActive(false);
            index = this.ChangeSlide(-1, this.npcInfoHanlabongUI.gameObject, kr, en);
            npcButton.RemoteStartLooking();
            this.openUI = null;
        });

        kr_Button.onClick.AddListener(() => {
            this.Localizing(Language.KR);
        });

        en_Button.onClick.AddListener(() => {
            this.Localizing(Language.EN);
        });

        nextButton.onClick.AddListener(() => {
            index = this.ChangeSlide(index, this.npcInfoHanlabongUI.gameObject, kr, en);
            if(index == 0) {
                npcButton.RemoteStartLooking();
                this.openUI = null;
            }
        });

        let index = 0;

        /* Language */
        this.krObjects.push(kr.gameObject);
        this.enObjects.push(en.gameObject);
        this.krButtonsImages.push(kr_Button.GetComponent<Image>());
        this.enButtonsImages.push(en_Button.GetComponent<Image>());
        
        /* World Button */
        const npcButton:LookAt = this.npcInfoHanlabongButton.GetComponent<LookAt>();
        this.npcInfoHanlabongButton = null;
    }

    /* Samdasu Set Inventory UI */
    private SetStickerInventoryUI() {
        const closeButton = this.stickerInventoryUI.GetChild(1).GetComponent<Button>();

        closeButton.onClick.AddListener(() => {
            // close UI
            this.stickerInventoryUI.gameObject.SetActive(false);
            this.openUI = null;
        });
    }

    /* Samdasu Buy Panel */
    private SetBuyPanel() {
        /* Main Buy Panel */
        const background = this.buyStickerUI.GetChild(0);
        const closeButton = this.buyStickerUI.GetChild(1).GetComponent<Button>();
        const stickerBuyPanel = this.buyStickerUI.GetChild(2);
        const stickerSelectedPanel = this.buyStickerUI.GetChild(3);
        if(!this.stickerBuyPanel) this.stickerBuyPanel = stickerBuyPanel;

        const kr = background.GetChild(0);
        const en = background.GetChild(1);
        
        closeButton.onClick.AddListener(() => {
            // close UI
            this.buyStickerUI.gameObject.SetActive(false);
            for(const btn of npcButtons) btn.RemoteStartLooking();
            this.selectedSticker = null;
            this.openUI = null;
        });

        /* Buy Sticker */
        for(let i=0; i<stickerBuyPanel.childCount; i++) {
            const button = stickerBuyPanel.GetChild(i).GetComponent<Button>();
            const targetImage = button.transform.GetComponent<Image>();
            button.onClick.AddListener(() => {
                // Buy Button
                // const key = i+1 < 10 ? `_0${(i+1)}` : `_${(i+1)}` ;
                const key = button.name;
                const selected = StickerType[key];
                console.log(` selected : ${selected} `);
                
                if(!this.selectedSticker) {
                    this.selectedSticker = {
                        Selected_A_Type:selected,
                        Selected_B_Type:null,
                    };
                    image_A.sprite = targetImage.sprite;

                } else {
                    if(!this.selectedSticker.Selected_A_Type) {
                        this.selectedSticker.Selected_A_Type = selected;
                        image_A.sprite = targetImage.sprite;

                    } else {
                        this.selectedSticker.Selected_B_Type = selected;
                        image_B.sprite = targetImage.sprite;
                    }
                }
            });
        }

        /* Buy Control Panel */
        const buyButton = stickerSelectedPanel.GetChild(0).GetComponent<Button>();
        const clearButton = stickerSelectedPanel.GetChild(1).GetComponent<Button>();
        const Selected_A = stickerSelectedPanel.GetChild(2).GetComponent<Button>();
        const Selected_B = stickerSelectedPanel.GetChild(3).GetComponent<Button>();
        buyButton.onClick.AddListener(() => {
            if(!this.selectedSticker ||
                !this.selectedSticker.Selected_A_Type ||
                !this.selectedSticker.Selected_B_Type) return console.error(ERROR.NOT_SELECTED_STICKERS);

            // send DATA
            const data = new RoomData();
            data.Add(SendName.trashCount, 10);
            data.Add(SendName.Selected_A, this.selectedSticker.Selected_A_Type);
            data.Add(SendName.Selected_B, this.selectedSticker.Selected_B_Type);
            this.room.Send(MESSAGE.Add_Sticker, data.GetObject());

            // close UI
            this.buyStickerUI.gameObject.SetActive(false);
            for(const btn of npcButtons) btn.RemoteStartLooking();
            this.selectedSticker = null;
            this.openUI = null;
            image_A.sprite = null;
            image_B.sprite = null;
            GameManager.instance.ClearStampMission(StampType.STAMP_TRASH);
        });

        clearButton.onClick.AddListener(() => {
            this.selectedSticker = null;
            image_A.sprite = null;
            image_B.sprite = null;
        })

        Selected_A.onClick.AddListener(() => {
            if(this.selectedSticker) this.selectedSticker.Selected_A_Type = null;
            if(image_A) image_A.sprite = null;
        })

        Selected_B.onClick.AddListener(() => {
            if(this.selectedSticker) this.selectedSticker.Selected_B_Type = null;
            if(image_B) image_B.sprite = null;
        })

        /* Change Image */
        const image_A = Selected_A.transform.GetChild(0).GetComponent<Image>();
        const image_B = Selected_B.transform.GetChild(0).GetComponent<Image>();

        /* Language */
        this.krObjects.push(kr.gameObject);
        this.enObjects.push(en.gameObject);
        
        /* World Button */
        const npcButtons:LookAt[] = [];
        for(const button of this.npcTrashButtons) {
            const look = button.GetComponent<LookAt>();
            npcButtons.push(look);
        }
    }
    
    /* Samdasu Button Panel */
    private SetButtonPanel() {
        const returnButton = this.buttonPanel.GetChild(0).GetComponent<Button>();
        const horseButton = this.buttonPanel.GetChild(1).GetComponent<Button>();
        const invenButton = this.buttonPanel.GetChild(2).GetComponent<Button>();
        const stampButton = this.buttonPanel.GetChild(3).GetComponent<Button>();

        returnButton.onClick.AddListener(() => {
            if(this.currentSamdasuState) {
                const data = new RoomData();
                data.Add(SendName.SamdasuState, this.currentSamdasuState);
                data.Add(SendName.isComplete, false);
                this.room.Send(MESSAGE.Ride_OFF, data.GetObject());
            }
            this.currentSamdasuState = null;
        });
        
        horseButton.onClick.AddListener(() => {
            if(!this.isHorseRide) {
                // Ride ON
                this.room.Send(MESSAGE.Ride_Horse, null);
            } else {
                // Ride OFF
                const data = new RoomData();
                data.Add(SendName.SamdasuState, MESSAGE.Ride_Horse);
                data.Add(SendName.isComplete, true);
                this.room.Send(MESSAGE.Ride_OFF, data.GetObject());
            }
        });
        
        invenButton.onClick.AddListener(() => {
            this.stickerInventoryUI.gameObject.SetActive(!this.stickerInventoryUI.gameObject.activeSelf);
            this.openUI = this.stickerInventoryUI.gameObject.activeSelf ? this.stickerInventoryUI.gameObject : null;
        });
        
        stampButton.onClick.AddListener(() => {
            this.stampUI.gameObject.SetActive(!this.stampUI.gameObject.activeSelf);
            this.openUI = this.stampUI.gameObject.activeSelf ? this.stampUI.gameObject : null;
        });
    }
    
    /* Samdasu Stamp UI */
    public SetStampUI(player_stamp:ArraySchema<Stamp>) {
        const closeButton = this.stampUI.GetChild(1).GetComponent<Button>();
        const stampPanel = this.stampUI.GetChild(2);

        closeButton.onClick.AddListener(() => {
            // close UI
            this.stampUI.gameObject.SetActive(false);
            this.openUI = null;
        });
        
        /* Stamps */
        const values = Object.keys(StampType);
        const keys = values.map(key => StampType[key]);
        if(player_stamp.Count != keys.length -1) return console.error(`SetStampUI NOT Matched length ${player_stamp.Count} != ${keys.length}`);
        
        this.stamps = new Map<string, StampUI>();
        for(let i=0; i<player_stamp.Count; i++) {
            for(const key of keys) {
                if(key == player_stamp[i].name) {
                    stampPanel.GetChild(i).name = key;
                    this.stamps.set(key, this.ProcessingStamp(stampPanel.GetChild(i), key, player_stamp[i].isClear));
                    this.UpdateStampUI(this.room.SessionId, player_stamp[i] as Stamp);
                }
            }
        }
    }
    
    /* Samdasu Sticker UI */
    public SetStickerUI(player_sticker:ArraySchema<Sticker>) {
        /* Stickers */
        const values = Object.keys(StickerType);
        const keys = values.map(key => StickerType[key]);
        if(player_sticker.Count != keys.length -1) return console.error(`SetStickerUI NOT Matched length ${player_sticker.Count} != ${keys.length}`);
        
        this.stickers = new Map<string, StickerUI>();
        for(let i=0; i<player_sticker.Count; i++) {
            for(const key of keys) {
                if(key == player_sticker[i].name) {
                    this.stickerBuyPanel.GetChild(i).name = key;
                    this.stickerRenderPanel.GetChild(i).name = key;
                    this.stickerInventoryUI.GetChild(4).GetChild(i).name = key;
                    this.stickers.set(key, this.ProcessingSticker(
                        this.stickerBuyPanel.GetChild(i),
                        this.stickerRenderPanel.GetChild(i),
                        this.stickerInventoryUI.GetChild(4).GetChild(i), key, player_sticker[i].count));
                    this.UpdateStickerUI(this.room.SessionId, player_sticker[i] as Sticker);
                }
            }
        }
    }
    
    /* Samdasu Update Stamp UI */
    private UpdateStampUI(sessionId:string, new_stamp:Stamp) {
        if(this.room.SessionId != sessionId) return;
        if(this.stamps.has(new_stamp.name)) {
            const stampUI = this.stamps.get(new_stamp.name);
            stampUI.stamp.isClear = new_stamp.isClear;
            stampUI.transform.GetChild(0).gameObject.SetActive(new_stamp.isClear);
        }
        SyncIndexManager.STAMPS.set(new_stamp.name, new_stamp);
    }
    
    /* Samdasu Update Sticker UI */
    private UpdateStickerUI(sessionId:string, new_sticker:Sticker) {
        if(this.room.SessionId != sessionId) return;
        if(this.stickers.has(new_sticker.name)) {
            const stickerUI = this.stickers.get(new_sticker.name);
            stickerUI.buy.countText.text = `${new_sticker.count}`;
            stickerUI.button.countText.text = `${new_sticker.count}`;
            stickerUI.inventory.countText.text = `${new_sticker.count}`;
        }
        SyncIndexManager.STICKERS.set(new_sticker.name, new_sticker);
    }

    /* Samdasu Trash Count */
    public UpdatePlayerUI() {
        this.trashCountText.text = `${SyncIndexManager.TrashCount}`;
        this.trashScoreText.text = `${SyncIndexManager.Score}`;

        // SyncIndexManager.Rank = this.player.samdasu.Rank;
        // SyncIndexManager.Stamps = this.player.samdasu.Stamps as Array<Stamp>;
        // SyncIndexManager.Stickers = this.player.samdasu.Stickers as Array<Sticker>;
    }

    /* Samdasu Processing Stamp UI */
    private ProcessingStamp(UI:Transform, key:string, clear:boolean = false) {
        UI.name = key.toString();
        const stampUI:StampUI = {
            gameObject:UI.gameObject,
            transform:UI,
            stamp:{
                name:key.toString(),
                isClear:clear,
            },
        }
        return stampUI;
    }

    /* Samdasu Processing Sticker UI */
    private ProcessingSticker(Buy:Transform, Button:Transform, Inventory:Transform, key:string, cnt:number = 0) {
        Buy.name = key.toString();
        Button.name = key.toString();
        Inventory.name = key.toString();
        const stickerUI:StickerUI = {
            buy:{
                gameObject:Buy.gameObject,
                transform:Buy,
                countText:Buy.GetComponentInChildren<Text>(),
                countImage:Buy.GetChild(0).GetComponent<Image>(),
            },
            button:{
                gameObject:Button.gameObject,
                transform:Button,
                countText:Button.GetComponentInChildren<Text>(),
                countImage:Button.GetChild(0).GetComponent<Image>(),
            },
            inventory:{
                gameObject:Inventory.gameObject,
                transform:Inventory,
                countText:Inventory.GetComponentInChildren<Text>(),
                countImage:Inventory.GetChild(0).GetComponent<Image>(),
            },
            sticker:{
                name:key.toString(),
                count:cnt,
            },
        }
        return stickerUI;
    }

    /* Change Slide */
    private ChangeSlide(index:number, ui:GameObject, kr:Transform, en:Transform) {
        /* Invisible All */
        for(let i=0; i<kr.childCount; i++) {
            kr.GetChild(i).gameObject.SetActive(false);
            en.GetChild(i).gameObject.SetActive(false);
        }

        /* Visible Next Index */
        index++;
        if(index < kr.childCount) {
            kr.GetChild(index).gameObject.SetActive(true);
            en.GetChild(index).gameObject.SetActive(true);

        } else {
            index = 0;
            ui.SetActive(false);
            kr.GetChild(index).gameObject.SetActive(true);
            en.GetChild(index).gameObject.SetActive(true);
        }
        return index;
    }

    /* Change Language */
    private Localizing(lag:Language) {
        SyncIndexManager.language = lag;
        if(lag == Language.KR) {
            for(const kr of this.krObjects) kr.SetActive(true);
            for(const en of this.enObjects) en.SetActive(false);
            for(const krImage of this.krButtonsImages) krImage.sprite = this.krButtonImage_Pushed
            for(const enImage of this.enButtonsImages) enImage.sprite = this.enButtonImage
            this.helpButtonImage.sprite = this.krHelpImage;
            this.sureButtonImage.sprite = this.krSureImage;
            this.cardButtonImage.sprite = this.krCardImage;

        } else if(lag == Language.EN) {
            for(const kr of this.krObjects) kr.SetActive(false);
            for(const en of this.enObjects) en.SetActive(true);
            for(const krImage of this.krButtonsImages) krImage.sprite = this.krButtonImage
            for(const enImage of this.enButtonsImages) enImage.sprite = this.enButtonImage_Pushed
            this.helpButtonImage.sprite = this.enHelpImage;
            this.sureButtonImage.sprite = this.enSureImage;
            this.cardButtonImage.sprite = this.enCardImage;
        }
    }
}