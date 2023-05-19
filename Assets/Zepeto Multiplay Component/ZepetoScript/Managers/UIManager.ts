import { ArraySchema } from 'types/ArraySchema';
import { Color, GameObject, RectTransform, Transform } from 'UnityEngine';
import { Button, Image, Text } from 'UnityEngine.UI';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from './GameManager';
import { Datas, LoadingType, Stamp, StampUI, StampType, Sticker, StickerSelected, StickerUI, TrashCreater, MESSAGE, StickerType, SendName, ERROR } from './TypeManager';

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
    private openUI: GameObject;
    private isPlaying: boolean;
    private isLoading: boolean;
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;
    
    /* Samdasu Property */
    @Header("* Samdasu Field")
    @Header("All range")
    @SerializeField() private trashCountText: Text;
    @SerializeField() private trashScoreText: Text;
    @SerializeField() private buttonPanel: Transform;
    public enabledColor:Color;
    public disabledColor:Color;
    
    @Header("Stamps UIs")
    @SerializeField() private stampUI: Transform;

    @Header("Stickers UIs")
    @SerializeField() private stickerBuyPanel: Transform;
    @SerializeField() private stickerRenderPanel: Transform;
    @SerializeField() private stickerInventoryPanel: Transform;
    @SerializeField() private buyStickerUI: Transform;
    
    @Header("NPCs UIs")
    @SerializeField() private npcHorseUI: Transform;
    @SerializeField() private npcTraderUI: Transform;
    @SerializeField() private npcCreaterUI: Transform;
    @SerializeField() private npcDrinkerUI: Transform;

    private stamps:Map<string, StampUI>;
    private stickers:Map<string, StickerUI>;
    private selectedSticker:StickerSelected;
    private trashCreater:TrashCreater;

    @NonSerialized() public isHorseRide: boolean = false;

    /* Ride Controller */
    private _currentSamdasuState: string;
    public get currentSamdasuState(): string { return this._currentSamdasuState; }
    public set currentSamdasuState(value: string) {
        if(!this._currentSamdasuState) {
            this._currentSamdasuState = value;
        }
        const check = value != null && value != undefined;
        this.buttonPanel.GetChild(0).gameObject.SetActive(check);
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
                console.log(` <<<<< AddMessageHandler MESSAGE.Clear_Stamp >>>>> `);
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

    public RemoteStart() {
        /* Samdasu */
        this.SetHorseNPCUI();
        this.SetTraderNPCUI();
        this.SetCreaterNPCUI();
        this.SetDrinkerNPCUI();
        this.SetBuyPanel();
        this.SetButtonPanel();
        this.UpdatePlayerUI();
    }

    /* Get Loading Image Object */ 
    public GetLoadingImage(type:LoadingType) {
        switch(type.toString()) {
            case LoadingType.Start:
                const start_loading = this.canvas.transform.GetChild(0).gameObject;
                return start_loading;

            case LoadingType.Teleport:
                const teleport_loading = this.canvas.transform.GetChild(1).gameObject;
                return teleport_loading;

            default :
                return null;
        }
    }

    /* Samdasu Trash Count */
    public UpdatePlayerUI() {
        this.trashCountText.text = `${SyncIndexManager.TrashCount}`;
        this.trashScoreText.text = `${SyncIndexManager.Score}`;

        // SyncIndexManager.Rank = this.player.samdasu.Rank;
        // SyncIndexManager.Stamps = this.player.samdasu.Stamps as Array<Stamp>;
        // SyncIndexManager.Stickers = this.player.samdasu.Stickers as Array<Sticker>;
    }

    /* Samdasu NPC Horse Rental UI */
    private SetHorseNPCUI() {
        const horseButton = this.npcHorseUI.GetChild(1).GetComponent<Button>();

        horseButton.onClick.AddListener(() => {
            this.npcHorseUI.gameObject.SetActive(false);
            this.buttonPanel.GetChild(1).gameObject.SetActive(true);
        });
    }

    /* Samdasu NPC Trader UI */
    private SetTraderNPCUI() {
        const closeButton = this.npcTraderUI.GetChild(1).GetComponent<Button>();
        const pointButton = this.npcTraderUI.GetChild(2).GetComponent<Button>();
        const stickButton = this.npcTraderUI.GetChild(3).GetComponent<Button>();

        closeButton.onClick.AddListener(() => {
            // close UI
            this.npcTraderUI.gameObject.SetActive(false);
        });
        
        stickButton.onClick.AddListener(() => {
            // get sticker
            if(SyncIndexManager.TrashCount >= 10) {
                this.npcTraderUI.gameObject.SetActive(false);
                this.buyStickerUI.gameObject.SetActive(true);
            }
        });

        pointButton.onClick.AddListener(() => {
            // get point
            if(SyncIndexManager.TrashCount >= 10) {
                const data = new RoomData();
                data.Add(SendName.trashCount, 10);
                this.room.Send(MESSAGE.Add_Point, data.GetObject());
                GameManager.instance.ClearStampMission(StampType.STAMP_TRASH);
            } else {

            }
        });
    }

    /* Samdasu NPC Creater UI */
    private SetCreaterNPCUI() {
        const closeButton = this.npcCreaterUI.GetChild(1).GetComponent<Button>();
        const noButton = this.npcCreaterUI.GetChild(2).GetComponent<Button>();
        const yesButton = this.npcCreaterUI.GetChild(3).GetComponent<Button>();
        const count_text = this.npcCreaterUI.GetChild(5).GetComponent<Text>();

        console.log(` ********** SetCreaterNPCUI ${closeButton.onClick}`);
        closeButton.onClick.AddListener(() => {
            // close UI
            console.log(` ********** closeButcloseButton.onClickton`);
            this.npcCreaterUI.gameObject.SetActive(false);
        });
        console.log(` ********** closeButton.onClick ${closeButton.onClick.GetPersistentMethodName}`);
        
        console.log(` ********** noButton ${noButton}`);
        noButton.onClick.AddListener(() => {
            console.log(` ********** noButton.onClick`);
            this.npcCreaterUI.gameObject.SetActive(false);
        });

        console.log(` ********** yesButton ${yesButton}`);
        yesButton.onClick.AddListener(() => {
            // trash Visible
            console.log(` ********** yesButton.onClick`);
            this.npcCreaterUI.gameObject.SetActive(false);
            GameManager.instance.onTrashGamePlay();
        });
        yesButton.gameObject.SetActive(false);

        count_text.text = `30`;
        this.trashCreater = {
            yesButton:yesButton.gameObject,
            count_text:count_text,
        };
    }

    /* Samdasu NPC Drinker UI */
    private SetDrinkerNPCUI() {
        const closeButton = this.npcDrinkerUI.GetChild(1).GetComponent<Button>();
        const noButton = this.npcDrinkerUI.GetChild(2).GetComponent<Button>();
        const yesButton = this.npcDrinkerUI.GetChild(3).GetComponent<Button>();
        
        closeButton.onClick.AddListener(() => {
            // close UI
            this.npcDrinkerUI.gameObject.SetActive(false);
        });
        
        noButton.onClick.AddListener(() => {
            this.npcDrinkerUI.gameObject.SetActive(false);
        });

        yesButton.onClick.AddListener(() => {
            // trash Visible
            this.npcDrinkerUI.gameObject.SetActive(false);
            GameManager.instance.onPlayerDrink();
        });
    }

    /* Samdasu Update NPC Creater UI */
    public UpdateCreaterNPCUI(visibleCount:number) {
        this.trashCreater.count_text.text = `${visibleCount}`;
        const visible = !(visibleCount > 0);
        this.trashCreater.yesButton.gameObject.SetActive(visible);
    }

    /* Samdasu Buy Panel */
    private SetBuyPanel() {
        /* Main Buy Panel */
        const closeButton = this.buyStickerUI.GetChild(1).GetComponent<Button>();
        const stickerBuyPanel = this.buyStickerUI.GetChild(2);
        const stickerSelectedPanel = this.buyStickerUI.GetChild(3);
        if(!this.stickerBuyPanel) this.stickerBuyPanel = stickerBuyPanel;
        
        closeButton.onClick.AddListener(() => {
            // close UI
            this.buyStickerUI.gameObject.SetActive(false);
            this.selectedSticker = null;
        });

        /* Buy Sticker */
        for(let i=0; i<10; i++) {
            const button = stickerBuyPanel.GetChild(i).GetComponent<Button>();
            const targetImage = button.transform.GetComponent<Image>();
            button.onClick.AddListener(() => {
                // Buy Button
                const key = i+1 < 10 ? `_0${(i+1)}` : `_${(i+1)}` ;
                const selected = StickerType[key];
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
        const okButton = stickerSelectedPanel.GetChild(0).GetComponent<Button>();
        const clearButton = stickerSelectedPanel.GetChild(1).GetComponent<Button>();
        const Selected_A = stickerSelectedPanel.GetChild(2).GetComponent<Button>();
        const Selected_B = stickerSelectedPanel.GetChild(3).GetComponent<Button>();
        okButton.onClick.AddListener(() => {
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
            this.selectedSticker = null;
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
            this.selectedSticker.Selected_A_Type = null;
            image_A.sprite = null;
        })

        Selected_B.onClick.AddListener(() => {
            this.selectedSticker.Selected_B_Type = null;
            image_B.sprite = null;
        })

        /* Change Image */
        const image_A = Selected_A.transform.GetChild(0).GetComponent<Image>();
        const image_B = Selected_B.transform.GetChild(0).GetComponent<Image>();
    }
    
    /* Samdasu Button Panel */
    private SetButtonPanel() {
        const returnButton = this.buttonPanel.GetChild(0).GetComponent<Button>();
        const horseButton = this.buttonPanel.GetChild(1).GetComponent<Button>();
        const stampButton = this.buttonPanel.GetChild(2).GetComponent<Button>();
        const invenButton = this.buttonPanel.GetChild(3).GetComponent<Button>();
        const mapButton = this.buttonPanel.GetChild(4).GetComponent<Button>();

        returnButton.onClick.AddListener(() => {
            console.log(`this.currentSamdasuState ${this.currentSamdasuState}`);
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
        
        stampButton.onClick.AddListener(() => {
            this.stampUI.gameObject.SetActive(!this.stampUI.gameObject.activeSelf);
        });
        
        invenButton.onClick.AddListener(() => {
            this.stickerInventoryPanel.gameObject.SetActive(!this.stickerInventoryPanel.gameObject.activeSelf);
        });

        mapButton.onClick.AddListener(() => {
            console.log(`mapButton touched`);
        });
    }
    
    /* Samdasu Stamp UI */
    public SetStampUI(player_stamp:ArraySchema<Stamp>) {
        const closeButton = this.stampUI.GetChild(1).GetComponent<Button>();
        const stampPanel = this.stampUI.GetChild(2);
        closeButton.onClick.AddListener(() => {
            // close UI
            this.stampUI.gameObject.SetActive(false);
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
                    this.stickerInventoryPanel.GetChild(2).GetChild(i).name = key;
                    this.stickers.set(key, this.ProcessingSticker(
                        this.stickerBuyPanel.GetChild(i),
                        this.stickerRenderPanel.GetChild(i),
                        this.stickerInventoryPanel.GetChild(2).GetChild(i),
                        key, player_sticker[i].count));
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
            
            if(new_sticker.count > 0) {
                stickerUI.buy.countImage.color = this.enabledColor;
                stickerUI.button.countImage.color = this.enabledColor;
                stickerUI.inventory.countImage.color = this.enabledColor;
            } else {
                stickerUI.buy.countImage.color = this.disabledColor;
                stickerUI.button.countImage.color = this.disabledColor;
                stickerUI.inventory.countImage.color = this.disabledColor;
            }
        }
        SyncIndexManager.STICKERS.set(new_sticker.name, new_sticker);
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
}