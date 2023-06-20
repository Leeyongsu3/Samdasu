import { GameObject, RectTransform, Transform, Vector2, Vector3, WaitForSeconds } from 'UnityEngine';
import { FormerlySerializedAsAttribute } from 'UnityEngine.Serialization';
import { Button, Text } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GetRangeRankResponse, LeaderboardAPI, ResetRule, SetScoreResponse } from 'ZEPETO.Script.Leaderboard';
import { Users, WorldService, ZepetoWorldHelper } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from './GameManager';
import { RankData, RankUI } from './TypeManager';

export default class LeaderBoardManager extends ZepetoScriptBehaviour {

    /* Properties */
    @SerializeField() private rankCanvas:Transform;
    private rankUIs:RankUI[] = [];
    private _isStarted: boolean = false;
    public get isStarted(): boolean { return this._isStarted; }
    private set isStarted(value: boolean) { this._isStarted = value; }
    private isGetPlayer:boolean = false;

    /* From GameManager */
    public RemoteStart(userId:string) {
        for(let i=0; i<this.rankCanvas.childCount; i++) {
            const panel = this.rankCanvas.GetChild(i);
            this.SetRankPanel(panel, i);
        }
        this.UpdateRankData();
        this.StartCoroutine(this.GetRank(userId));
        this.isStarted = true;
    }

    /* Init Rank Panel UI */
    private SetRankPanel(panel:Transform, index:number) {
        const text_Id = panel.GetChild(0).GetComponent<Text>();
        const text_Score = panel.GetChild(1).GetComponent<Text>();
        
        /* Set Clean */
        text_Id.text = RankData.Empty;
        text_Score.text = RankData.Zero;
        
        /* Pushed Array */
        const ui:RankUI = {
            panel:panel.gameObject,
            rank:index,
            text_Id:text_Id,
            text_Score:text_Score,
        };
        this.rankUIs.push(ui);
    }

    /* Update Local Player's Score */
    public AddScore() {
        LeaderboardAPI.SetScore(RankData.TrashScoreId, 100, (result:SetScoreResponse) => {
            GameManager.instance.SendUpdateRank();
        }, (error:string) => {
            console.error(` UpdateScore error : ${error} `);
        })
    }

    /* Update Local Player's Score */
    // public UpdateScoreAggressive(aggresiveScore:number) {
    //     LeaderboardAPI.SetScore(RankData.TrashScoreId, aggresiveScore, (result:SetScoreResponse) => {
    //     }, (error:string) => {
    //         console.error(` UpdateScore error : ${error} `);
    //     })
    //     this.UpdateRankData();
    // }

    /* Update Local Player's Score */
    public UpdateScore() {
        LeaderboardAPI.SetScore(RankData.TrashScoreId, 0, (result:SetScoreResponse) => {
        }, (error:string) => {
            console.error(` UpdateScore error : ${error} `);
        })
        this.UpdateRankData();
    }

    /* Get Local Player's Rank */
    public * GetRank(id:string) {
        let count = 0;
        let page = 1;
        let page_limit = 100;
        let notRanked:boolean = false;
        let leaderCheck = true;
        const waitTask = new WaitForSeconds(0.1);
        
        while(true) {
            if(leaderCheck) {
                leaderCheck = false;
                count++;
                if(this.isGetPlayer) break;
                if(notRanked) {
                    console.error(`랭킹데이터가 없음 : ${id}`);
                    break;
                }
                
                LeaderboardAPI.GetRangeRank(RankData.TrashScoreId, page + (page_limit * (count-1)), page_limit * count, ResetRule.week, false, (result: GetRangeRankResponse) => {
                    /* Get Player Datas */
                    if (result.rankInfo.rankList) {
                        for(let i=0; i < result.rankInfo.rankList.length; i++) {
                            const data = result.rankInfo.rankList.get_Item(i);
                            if(id != data.member) continue;
                            this.isGetPlayer = true;
                            GameManager.instance.GetRanked(data);
                            break;
                        }
                    } else {
                        notRanked = true;
                    }
                    leaderCheck = true;
                }, (error: string) => {
                    console.error(error);
                });
            } else {
                yield waitTask;
            }
        }
    }

    /* Leaderboard + UserInfo */
    private UpdateRankData() {
        console.log(`[LeaderBoard] Try to GetRangeRank ${RankData.TrashScoreId}`);
        LeaderboardAPI.GetRangeRank(RankData.TrashScoreId, RankData.Rank_Start, RankData.Rank_End, ResetRule.week, false, (result: GetRangeRankResponse) => {
            console.log(`[LeaderBoard] success GetRangeRank`);
            /* Text Clear */
            for(let i=0; i<this.rankUIs.length; i++) {
                const ui = this.rankUIs[i];
                ui.text_Id.text = RankData.Empty;
                ui.text_Score.text = RankData.Zero;
            }
            
            /* Get Player Datas */
            const mems:string[] = [];
            const ids:string[] = [];
            if (result.rankInfo.rankList) {
                for (let i=0; i < result.rankInfo.rankList.length; i++) {
                    if(9 < i) {
                        break;
                    } else {
                        const data = result.rankInfo.rankList.get_Item(i);
                        mems.push(data.member);
                    }
                }
            }

            /* Get Player ID */
            ZepetoWorldHelper.GetUserInfo(mems, (info: Users[]) => {
                console.log(`[LeaderBoard] success GetUserInfo `);
                for (const data of info) {
                    console.log(`data.zepetoId ${data.zepetoId} ===> ${data.zepetoId == null}, ${data.zepetoId == "null"}`);
                    
                    if(data.zepetoId) {
                        ids.push(this.ProcessingId(data.zepetoId))
                    } else {
                        ids.push(this.ProcessingId(data.name))
                    }
                }

                /* Update Rank Text */
                if (result.rankInfo.rankList) {
                    for (let i=0; i < result.rankInfo.rankList.length; i++) {
                        if(9 < i) break;
                        const data = result.rankInfo.rankList.get_Item(i);
                        const ui = this.rankUIs[i];
                        ui.text_Id.text = ids[i];
                        ui.text_Score.text = data.score.toString();
                    }
                }
            }, (error) => {
                return console.log(error);
            });
        }, (error: string) => {
            console.error(error);
        });
    }

    private ProcessingId(beforeId:string): string {
        if(beforeId.length < 8) {
            return beforeId;
        }
        return `${beforeId.slice(0, 6)}***`;
    }



    /* Leaderboard GetRank Last Week */
    public GetRankLastWeek() {
        console.log(`[LeaderBoard] Try to GetRangeRank`);
        LeaderboardAPI.GetRangeRank(RankData.TrashScoreId, 1, 15, ResetRule.week, true, (result: GetRangeRankResponse) => {
            console.log(`[LeaderBoard] success GetRangeRank`);
            
            /* Get Player Datas */
            const mems:string[] = [];
            if (result.rankInfo.rankList) {
                for (let i=0; i < result.rankInfo.rankList.length; i++) {
                    const data = result.rankInfo.rankList.get_Item(i);
                    mems.push(data.member);
                    console.log(`Rank : ${data.rank} / Score : ${data.score} / ZepetoId : ${data.member} / Name : ${data.name}`);
                }
            }

            console.log(`===============================================`);
            

            /* Get Player ID */
            ZepetoWorldHelper.GetUserInfo(mems, (info: Users[]) => {
                console.log(`[LeaderBoard] success GetUserInfo `);
                let rank = 1;
                for (const data of info) {
                    console.log(`Rank : ${rank++} / ZepetoId : (${data.zepetoId}) / userID : ${data.userOid} / Name : ${data.name}`);
                }

            }, (error) => {
                return console.log(error);
            });
        }, (error: string) => {
            console.error(error);
        });
    }
}