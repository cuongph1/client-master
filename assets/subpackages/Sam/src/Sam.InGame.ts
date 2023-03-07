import SamPlayer from "./Sam.Player"
import SamNetworkClient from "../../../scripts/networks/SamNetworkClient";
import SamCmd from "./Sam.Cmd";
import Room from "./Sam.Room";
import InGame from "../../TienLen/src/TienLen.InGame"

const {ccclass, property} = cc._decorator;

@ccclass
export default class SamInGame extends InGame {

    public static instance: SamInGame = null;

    @property({
        type: SamPlayer,
        override: true
    })
    players: SamPlayer[] = [];

    onLoad () {
        SamInGame.instance = this;
        this.initRes();
    }

    actLeaveRoom() {
        SamNetworkClient.getInstance().send(new SamCmd.SendRequestLeaveGame());
    }

    userLeaveRoom(data) {
        var chair = this.convertChair(data.chair,this.players.length);
        this.players[chair].setLeaveRoom();
        if (chair == 0) {
            this.show(false);
            Room.instance.show(true);
            Room.instance.refreshRoom();
        }
    }

    chiaBai(data) {
        super.chiaBai(data);
        this.setActiveButtons(["bt_sam", "bt_huy_sam"], [true, true]);
        this.players.forEach(p => {
            if (p.active)
                p.setTimeRemain(data.timeBaoSam);
        });
    }
    chatEmotion(event, id) {
        SamNetworkClient.getInstance().send(new SamCmd.SendChatRoom(1, id));
        this.closeUIChat();
    }

    chatMsg() {
        if (this.edtChatInput.string.trim().length > 0) {
            if(this.edtChatInput.string.trim().length>30)
            {
                this.showToast("Bạn chat quá dài !");
                return;
            }
            SamNetworkClient.getInstance().send(new SamCmd.SendChatRoom(0, this.edtChatInput.string));
            this.edtChatInput.string = "";
            this.closeUIChat();
        }
    }
    sendSubmitTurn(cardSelected) {
        SamNetworkClient.getInstance().send(new SamCmd.SendDanhBai(!1, cardSelected));
    }

    sendPassTurn() {
        SamNetworkClient.getInstance().send(new SamCmd.SendBoLuot(!0));
    }

    actBaoSam() {
        SamNetworkClient.getInstance().send(new SamCmd.SendBaoSam());
    }

    actHuyBaoSam() {
        SamNetworkClient.getInstance().send(new SamCmd.SendHuyBaoSam());
    }

    onBaoSam(data) {
        var chair = this.convertChair(data.chair,this.players.length);
        var p = this.players[chair];
        p.setTimeRemain(0);
        p.setStatus("BÁO SÂM");
        if (data.chair == this.myChair)
            this.setActiveButtons(["bt_sam", "bt_huy_sam"], [false, false]);
    }

    onHuyBaoSam(data) {
        var chair = this.convertChair(data.chair,this.players.length);
        var p = this.players[chair];
        p.setTimeRemain(0);
        p.setStatus("HUỶ SÂM");
        if (data.chair == this.myChair)
            this.setActiveButtons(["bt_sam", "bt_huy_sam"], [false, false]);
    }

    onQuyetDinhSam(data) {
        this.setActiveButtons(["bt_sam", "bt_huy_sam"], [false, false]);
        if (data.isSam) {
            var chair = this.convertChair(data.chair,this.players.length);
            var p = this.players[chair];
            if (p.active)
                this.showToast(p.info.nickName + " được quyền báo sâm");
        }
    }
}
