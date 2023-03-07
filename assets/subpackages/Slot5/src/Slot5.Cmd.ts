import OutPacket from "../../../scripts/networks/Network.OutPacket";
import InPacket from "../../../scripts/networks/Network.InPacket";

const { ccclass } = cc._decorator;

export namespace cmd {
    export class Code {
        static SUBCRIBE = 13003;
        static UNSUBCRIBE = 13004;
        static CHANGE_ROOM = 13005;
        static PLAY = 13001;
        static UPDATE_RESULT = 13001;
        static UPDATE_POT = 13002;
        static AUTO = 13006;
        static STOP_AUTO = 13006;
        static FORCE_STOP_AUTO = 13008;
        static DATE_X2 = 13009;
        static BIG_WIN = 13010;
        static FREE = 13011;
        static FREE_DAI_LY = 13012;
        static MINIMIZE = 13013;
    }
    export class SendSubcribe extends OutPacket {
        constructor(roomId: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.SUBCRIBE);
            this.packHeader();
            this.putByte(roomId);
            this.updateSize();
        }
    }
    export class SendUnSubcribe extends OutPacket {
        constructor(roomId: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.UNSUBCRIBE);
            this.packHeader();
            this.putByte(roomId);
            this.updateSize();
        }
    }
    export class SendPlay extends OutPacket {
        constructor(betValue: number, lines: string) {
            super();            
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.PLAY);
            this.packHeader();
            this.putInt(betValue);
            this.putString(lines);
            this.updateSize();
        }
    }
    export class SendChangeRoom extends OutPacket {
        constructor(roomLeavedId: number, roomJoinedId: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.CHANGE_ROOM);
            this.packHeader();
            this.putByte(roomLeavedId);
            this.putByte(roomJoinedId);
            this.updateSize();
            console.log("change room");
        }
    }
    export class ReceiveUpdatePot extends InPacket {
        valueRoom1 = 0;
        valueRoom2 = 0;
        valueRoom3 = 0;
        // valueRoom4 = 0;
        x21 = 0;
        x22 = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.valueRoom1 = this.getLong();
            this.valueRoom2 = this.getLong();
            this.valueRoom3 = this.getLong();
            // this.valueRoom4 = this.getLong();
            this.x21 = this.getByte();
            this.x22 = this.getByte();
        }
    }
    export class ReceiveResult extends InPacket {
        ref = 0;
        result = 0;
        matrix = "";
        linesWin = "";
        haiSao = "";
        prize = 0;
        currentMoney = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.ref = this.getLong();
            this.result = this.getByte();
            this.matrix = this.getString();
            this.linesWin = this.getString();
            this.haiSao = this.getString();
            this.prize = this.getLong();
            this.currentMoney = this.getLong();
        }
    }
}
export default cmd;