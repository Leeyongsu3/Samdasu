import { Animator, GameObject, Quaternion, Transform, Vector3 } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import GameManager from '../Managers/GameManager';
import { Anim, ERROR, HorseRider, SamdasuState } from '../Managers/TypeManager';

export default class HorseRideManager extends ZepetoScriptBehaviour {

    /* Samdasu Field */
    @Header("Samdasus Field")
    @SerializeField() private horsePrefab: GameObject;
    @SerializeField() private horsePoolGroup: Transform;
    private horsePool: GameObject[];
    private horseRiders: HorseRider[] = [];
    private _localSessionId: string;
    public get localSessionId(): string { return this._localSessionId; }
    public set localSessionId(value: string) {
        if(this._localSessionId == null && value) {
            this._localSessionId = value;
        }
    }

    /* Async Player and Horse Animation */
    FixedUpdate() {
        if(!this.horseRiders) return;
        for(const rider of this.horseRiders) {
            if(!rider) continue;

            /* Riding Start */
            if(rider.ownerAnimator.GetInteger(Anim.SamdasuState) == SamdasuState.Ride_Horse) rider.startRiding = true;
            
            /* isRiding */
            if(rider.startRiding) {
                if(rider.ownerAnimator.GetInteger(Anim.SamdasuState) == SamdasuState.Ride_Horse) {
                    rider.horseAnimator.SetInteger(Anim.State, rider.ownerAnimator.GetInteger(Anim.State));
                    
                } else {
                    rider.horseAnimator.SetInteger(Anim.State, 1);
                    GameManager.instance.RideOFFHorse(rider.sessionId);
                }
            }
        }
    }

    /* Ride ON Horse */
    public RideHorse(sessionId:string, localSessionId:string) {
        
        /* Init */
        if(!this.horseRiders) this.horseRiders = [];

        /* Player Setting */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        const playerSoket = character.transform.GetChild(0).GetChild(3);
        character.additionalRunSpeed = 1;
        character.additionalWalkSpeed = 0.5;

        /* Player State Set */
        this.localSessionId = localSessionId;
        if(this.localSessionId == sessionId) GameManager.instance.SetSamdasuState(SamdasuState.Ride_Horse, true);

        /* Get Horse */
        const horse = this.GetHorse(playerSoket);

        /* Horse Setting */
        const horseRider:HorseRider = {
            sessionId:sessionId,
            horse:horse,
            horseAnimator:horse.transform.GetChild(0).GetComponent<Animator>(),
            ownerAnimator:character.ZepetoAnimator,
            startRiding:false,
        };
        this.horseRiders.push(horseRider);
    }

    /* Ride OFF Horse */
    public RideOFFHorse(sessionId:string) {
        /* Player Setting */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        character.additionalRunSpeed = 0;
        character.additionalWalkSpeed = 0;

        /* Player State Set */
        if(this.localSessionId == sessionId) GameManager.instance.SetSamdasuState(SamdasuState.Ride_Horse, false);
        
        /* Return Horse */
        this.ReturnHorse(sessionId);
    }

    /* Get Horse */
    private GetHorse(setParent:Transform) {
        /* Find or Create Usable Horse */
        let horse = this.FindUsableHorse();
        if(!horse) horse = this.InstantiateHorse();

        /* Set Data */
        horse.SetActive(true);
        horse.transform.SetParent(setParent);
        horse.transform.localScale = Vector3.one;
        horse.transform.localRotation = Quaternion.identity;
        horse.transform.localPosition = Vector3.forward * 0.3;
        return horse;
    }

    /* Return Horse */
    private ReturnHorse(sessionId:string) {
        /* Find Horse */
        const horse = this.OutputHorseInHorseRider(sessionId);
        if(!horse) return console.error(ERROR.NOT_FOUND_HORSE);
        
        /* Input Horse Group */
        horse.transform.SetParent(this.horsePoolGroup);
        horse.transform.position = this.horsePoolGroup.position;
        horse.transform.rotation = this.horsePoolGroup.rotation;
        horse.SetActive(false);
    }

    /* Find Usable Horse */
    private FindUsableHorse() {
        if(this.horsePool && this.horsePool.length > 0) {
            for(const horse of this.horsePool) {
                if(!horse.activeSelf && horse.transform.parent == this.horsePoolGroup) {
                    return horse;
                }
            }
        }
        return null;
    }

    /* Find and Remove Horse in HorseRider */
    private OutputHorseInHorseRider(sessionId:string) {
        for(let i=0; i<this.horseRiders.length; i++) {
            if(this.horseRiders[i].sessionId == sessionId) {
                const horseRider = this.horseRiders[i];
                this.horseRiders.splice(i, 1);
                return horseRider.horse;
            }
        }
        return null;
    }

    /* Instantiate Horse */
    private InstantiateHorse() {
        if(!this.horsePool) this.horsePool = [];

        const horseClone = GameObject.Instantiate<GameObject>(this.horsePrefab);
        this.horsePool.push(horseClone);
        return horseClone;
    }
}