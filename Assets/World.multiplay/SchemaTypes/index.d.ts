declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
		SyncTransforms: MapSchema<SyncTransform>;
		equipDatas: MapSchema<EquipData>;
	}
	class Player extends Schema {
		sessionId: string;
		zepetoHash: string;
		zepetoUserId: string;
		playerAdditionalValue: PlayerAdditionalValue;
		animationParam: ZepetoAnimationParam;
		gestureName: string;
		visit: number;
		samdasu: Samdasu;
	}
	class sVector3 extends Schema {
		x: number;
		y: number;
		z: number;
	}
	class sQuaternion extends Schema {
		x: number;
		y: number;
		z: number;
		w: number;
	}
	class SyncTransform extends Schema {
		Id: string;
		position: sVector3;
		localPosition: sVector3;
		rotation: sQuaternion;
		scale: sVector3;
		status: number;
		sendTime: number;
	}
	class PlayerAdditionalValue extends Schema {
		additionalWalkSpeed: number;
		additionalRunSpeed: number;
		additionalJumpPower: number;
	}
	class EquipData extends Schema {
		key: string;
		sessionId: string;
		itemName: string;
		prevItemName: string;
		bone: number;
		prevBone: number;
	}
	class ZepetoAnimationParam extends Schema {
		State: number;
		MoveState: number;
		JumpState: number;
		LandingState: number;
		MotionSpeed: number;
		FallSpeed: number;
		Acceleration: number;
		MoveProgress: number;
		isSit: boolean;
		isHold: boolean;
		SamdasuState: number;
	}
	class Samdasu extends Schema {
		SamdasuState: number;
		TrashCount: number;
		Score: number;
		Rank: number;
		Stickers: ArraySchema<Sticker>;
		Stamps: ArraySchema<Stamp>;
	}
	class Sticker extends Schema {
		name: string;
		count: number;
	}
	class Stamp extends Schema {
		name: string;
		isClear: boolean;
	}
}