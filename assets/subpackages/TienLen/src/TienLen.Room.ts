import InPacket from "../../../scripts/networks/Network.InPacket";
import TienLenNetworkClient from "../../../scripts/networks/TienLenNetworkClient";
import CardGameCmd from "../../../scripts/networks/CardGame.Cmd";
import TienLenCmd from "./TienLen.Cmd";
import Tween from "../../../scripts/common/Tween";
import Configs from "../../../scripts/common/Configs";
import Utils from "../../../scripts/common/Utils";
import App from "../../../scripts/common/App";
import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";
import TienLenGameLogic from "./TienLen.GameLogic";
import InGame from "./TienLen.InGame";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Room extends cc.Component {

    public static instance: Room = null;

    @property(cc.Node)
    roomContent: cc.Node = null;
    @property(cc.Prefab)
    roomItem: cc.Node = null;
    @property(cc.Node)
    ingameNode: cc.Node = null;
    @property(cc.Label)
    lbCoin: cc.Label = null;

    private ingame: InGame = null;

    onLoad() {
        Room.instance = this;

        this.ingame = this.ingameNode.getComponent(InGame);
        this.ingameNode.active = false;

        this.lbCoin.string = Utils.formatNumber(Configs.Login.Coin);
        BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
            this.lbCoin.string = Utils.formatNumber(Configs.Login.Coin);
        }, this);

        TienLenNetworkClient.getInstance().addOnClose(() => {
            this.actBack();
        }, this);
    }

    start() {
        TienLenNetworkClient.getInstance().addListener((data) => {
            let inpacket = new InPacket(data);
            let cmdId = inpacket.getCmdId();
            cc.log("TienLen cmd: ", cmdId);
            switch (cmdId) {
                case CardGameCmd.Code.MONEY_BET_CONFIG: {
                    let res = new CardGameCmd.ResMoneyBetConfig(data);
                    cc.log(res);
                    this.initRooms(res.list);
                    break;
                }
                case CardGameCmd.Code.JOIN_ROOM_FAIL: {
                    let res = new CardGameCmd.ReceivedJoinRoomFail(data);
                    var e = "";
                    switch (res.error) {
                        case 1:
                            e = "L\u1ed7i ki\u1ec3m tra th\u00f4ng tin!";
                            break;
                        case 2:
                            e = "Kh\u00f4ng t\u00ecm \u0111\u01b0\u1ee3c ph\u00f2ng th\u00edch h\u1ee3p. Vui l\u00f2ng th\u1eed l\u1ea1i sau!";
                            break;
                        case 3:
                            e = "B\u1ea1n kh\u00f4ng \u0111\u1ee7 ti\u1ec1n v\u00e0o ph\u00f2ng ch\u01a1i n\u00e0y!";
                            break;
                        case 4:
                            e = "Kh\u00f4ng t\u00ecm \u0111\u01b0\u1ee3c ph\u00f2ng th\u00edch h\u1ee3p. Vui l\u00f2ng th\u1eed l\u1ea1i sau!";
                            break;
                        case 5:
                            e = "M\u1ed7i l\u1ea7n v\u00e0o ph\u00f2ng ph\u1ea3i c\u00e1ch nhau 10 gi\u00e2y!";
                            break;
                        case 6:
                            e = "H\u1ec7 th\u1ed1ng b\u1ea3o tr\u00ec!";
                            break;
                        case 7:
                            e = "Kh\u00f4ng t\u00ecm th\u1ea5y ph\u00f2ng ch\u01a1i!";
                            break;
                        case 8:
                            e = "M\u1eadt kh\u1ea9u ph\u00f2ng ch\u01a1i kh\u00f4ng \u0111\u00fang!";
                            break;
                        case 9:
                            e = "Ph\u00f2ng ch\u01a1i \u0111\u00e3 \u0111\u1ee7 ng\u01b0\u1eddi!";
                            break;
                        case 10:
                            e = "B\u1ea1n b\u1ecb ch\u1ee7 ph\u00f2ng kh\u00f4ng cho v\u00e0o b\u00e0n!"
                    }
                    App.instance.alertDialog.showMsg(e);
                    break;
                }
                case TienLenCmd.Code.JOIN_ROOM_SUCCESS: {
                    let res = new TienLenCmd.ReceivedJoinRoomSuccess(data);
                    cc.log(res);
                    TienLenGameLogic.getInstance().initWith(res);
                    this.show(false);
                    this.ingame.show(true, res);
                    break;
                }
                case TienLenCmd.Code.UPDATE_GAME_INFO: {
                    let res = new TienLenCmd.ReceivedUpdateGameInfo(data);
                    cc.log(res);
                    this.show(false);
                    this.ingame.updateGameInfo(res);
                    break;
                }
                case TienLenCmd.Code.AUTO_START: {
                    let res = new TienLenCmd.ReceivedAutoStart(data);
                    cc.log(res);
                    TienLenGameLogic.getInstance().autoStart(res);
                    this.ingame.autoStart(res);
                    break;
                }
                case TienLenCmd.Code.USER_JOIN_ROOM: {
                    let res = new TienLenCmd.ReceiveUserJoinRoom(data);
                    cc.log(res);
                    this.ingame.onUserJoinRoom(res);
                    break;
                }
                case TienLenCmd.Code.CHAT_CHONG: {
                    let res = new TienLenCmd.ReceiveChatChong(data);
                    cc.log(res);
                    this.ingame.OnChatChong(res);
                    break;
                }
                case TienLenCmd.Code.FIRST_TURN: {
                    let res = new TienLenCmd.ReceivedFirstTurnDecision(data);
                    cc.log(res);
                    this.ingame.firstTurn(res);
                    break;
                }
                case TienLenCmd.Code.CHIA_BAI: {
                    let res = new TienLenCmd.ReceivedChiaBai(data);
                    cc.log(res);
                    this.ingame.chiaBai(res)
                    break;
                }
                case TienLenCmd.Code.CHANGE_TURN: {
                    let res = new TienLenCmd.ReceivedChangeTurn(data);
                    cc.log(res);
                    this.ingame.changeTurn(res);
                    break;
                }
                case TienLenCmd.Code.DANH_BAI: {
                    let res = new TienLenCmd.ReceivedDanhBai(data);
                    cc.log(res);
                    this.ingame.submitTurn(res);
                    break;
                }
                case TienLenCmd.Code.BO_LUOT: {
                    let res = new TienLenCmd.ReceivedBoluot(data);
                    cc.log(res);
                    this.ingame.passTurn(res);
                    break;
                }
                case TienLenCmd.Code.END_GAME: {
                    let res = new TienLenCmd.ReceivedEndGame(data);
                    cc.log(res);
                    this.ingame.endGame(res);
                    break;
                }
                case TienLenCmd.Code.CHAT_ROOM:
                    {
                        App.instance.showLoading(false);
                        let res = new TienLenCmd.ReceivedChatRoom(data);
                        cc.log("Sam CHAT_ROOM res : ", JSON.stringify(res));
                        this.ingame.playerChat(res);
                    }
                    break;
                case TienLenCmd.Code.UPDATE_MATCH: {
                    let res = new TienLenCmd.ReceivedUpdateMatch(data);
                    cc.log(res);
                    this.ingame.updateMatch(res);
                    break;
                }
                case TienLenCmd.Code.USER_LEAVE_ROOM: {
                    let res = new TienLenCmd.UserLeaveRoom(data);
                    cc.log(res);
                    this.ingame.userLeaveRoom(res);
                    break;
                }
                case TienLenCmd.Code.REQUEST_LEAVE_ROOM: {
                    let res = new TienLenCmd.ReceiveLeaveRoom(data);
                    cc.log(res);
                    this.ingame.RequestLeaveRoom(res);
                    break;
                }

                // case TienLenCmd.Code.RECONNECT_GAME_ROOM: {
                //     let res = new TienLenCmd.UserLeaveRoom(data);
                //     cc.log(res);
                //     this.ingame.userLeaveRoom(res);
                //     break;
                // }
            }
        }, this);

        //get list room
        this.refreshRoom();
    }

    initRooms(rooms) {
        this.roomContent.removeAllChildren();
        var bet = rooms[0].moneyBet;
        var id = 0;
        rooms.forEach(room => {
            if (room.moneyType == 1) {
                if (bet != room.moneyBet) {
                    id = 1;
                    bet = room.moneyBet;
                }
                else
                    id++;
                var item = cc.instantiate(this.roomItem);
                var txts = item.getComponentsInChildren(cc.Label);
                txts[0].string = room.stt;
                txts[1].string = "TLMN_" + room.moneyBet + "_" + id;
                Tween.numberTo(txts[2], room.moneyRequire, 0.3);
                Tween.numberTo(txts[3], room.moneyBet, 0.3);
                txts[4].string = room.nPersion + "/" + room.maxUserPerRoom;
                var progress = item.getComponentInChildren(cc.ProgressBar);
                progress.progress = room.nPersion / room.maxUserPerRoom;
                var btnJoin = item.getComponentInChildren(cc.Button);
                btnJoin.node.on(cc.Node.EventType.TOUCH_END, (event) => {
                    TienLenNetworkClient.getInstance().send(new CardGameCmd.SendJoinRoom(Configs.App.MONEY_TYPE, room.maxUserPerRoom, room.moneyBet, 0, room.roomIndex));
                });
                item.parent = this.roomContent;
            }
        });
    }
    

    actBack() {
        TienLenNetworkClient.getInstance().close();
        App.instance.loadScene("Lobby");
    }

    public show(isShow: boolean) {
        this.node.active = isShow;
        BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
    }

    refreshRoom() {
        TienLenNetworkClient.getInstance().send(new CardGameCmd.SendMoneyBetConfig());
    }
}