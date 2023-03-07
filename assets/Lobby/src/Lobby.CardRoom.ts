import InPacket from "../../scripts/networks/Network.InPacket";
import CardGameNetworkClient from "../../scripts/networks/CardGameNetworkClient";
import TienLenNetworkClient from "../../scripts/networks/TienLenNetworkClient";
import CardGameCmd from "../../scripts/networks/CardGame.Cmd";
import TienLenCmd from "../../subpackages/TienLen/src/TienLen.Cmd";
import Tween from "../../scripts/common/Tween";
import Config from "../../scripts/common/Configs";
import App from "../../scripts/common/App";
import TienLenGameLogic from "../../subpackages/TienLen/src/TienLen.GameLogic";

const { ccclass, property } = cc._decorator;

namespace Lobby {
    @ccclass
    export class CardRoom extends cc.Component {

        @property(cc.Node)
        roomContent: cc.Node = null;
        @property(cc.Prefab)
        roomItem: cc.Node = null;

        networkClient: CardGameNetworkClient = null;

        start() {
            this.networkClient.addListener(this.handleRoomRespone, this);
        }

        handleRoomRespone = (data) => {
            let inpacket = new InPacket(data);
            cc.log(inpacket.getCmdId());
            switch (inpacket.getCmdId()) {
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
                    App.instance.loadSceneInSubpackage("TienLen", "TienLen");
                    break;
                }
                case TienLenCmd.Code.AUTO_START: {
                    let res = new TienLenCmd.ReceivedAutoStart(data);
                    cc.log(res);
                    TienLenGameLogic.getInstance().autoStart(res);
                    break;
                }
            }
        };

        initRooms(rooms, client) {
            this.networkClient = client;

            this.roomContent.removeAllChildren();
            rooms.forEach(room => {
                var item = cc.instantiate(this.roomItem);
                var txts = item.getComponentsInChildren(cc.Label);
                Tween.numberTo(txts[2], room.moneyRequire, 0.3);
                Tween.numberTo(txts[3], room.moneyBet, 0.3);
                txts[4].string = room.nPersion + "/" + room.maxUserPerRoom;
                var progress = item.getComponentInChildren(cc.ProgressBar);
                progress.progress = room.nPersion / room.maxUserPerRoom;
                var btnJoin = item.getComponentInChildren(cc.Button);
                btnJoin.node.on(cc.Node.EventType.TOUCH_END, (event) => {
                    this.networkClient.send(new CardGameCmd.SendJoinRoom(Config.App.MONEY_TYPE, room.maxUserPerRoom, room.moneyBet, 0, room.roomIndex));
                });
                item.parent = this.roomContent;
            });
        }
    }
}
export default Lobby.CardRoom;
