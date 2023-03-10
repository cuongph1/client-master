import Configs from "../../../scripts/common/Configs";
import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";
import Utils from "../../../scripts/common/Utils";
import XocDiaNetworkClient from "./XocDia.XocDiaNetworkClient";
import cmd from "./XocDia.Cmd";
import InPacket from "../../../scripts/networks/Network.InPacket";
import App from "../../../scripts/common/App";
import XocDiaController from "./XocDia.XocDiaController";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Lobby extends cc.Component {

    @property(cc.Label)
    lblNickname: cc.Label = null;
    @property(cc.Label)
    lblCoin: cc.Label = null;

    @property(cc.Node)
    listItems: cc.Node = null;
    @property(cc.Node)
    itemTemplate: cc.Node = null;

    private inited = false;

    // onLoad () {}

    start() {

    }

    public init() {
        if (this.inited) return;
        this.inited = true;

        this.lblNickname.string = Configs.Login.Nickname;
        BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
            if (!this.node.active) return;
            this.lblCoin.string = Utils.formatNumber(Configs.Login.Coin);
        }, this);
        BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);

        XocDiaNetworkClient.getInstance().addListener((data) => {
            if (!this.node.active) return;
            let inpacket = new InPacket(data);
            switch (inpacket.getCmdId()) {
                case cmd.Code.LOGIN:
                    {
                        XocDiaNetworkClient.getInstance().send(new cmd.SendReconnect());
                    }
                    break;
                case cmd.Code.GETLISTROOM:
                    {
                        let res = new cmd.ReceiveGetListRoom(data);
                        console.log(res);
                        for (let i = 0; i < res.list.length; i++) {
                            let itemData = res.list[i];
                            let item = cc.instantiate(this.itemTemplate);
                            item.parent = this.listItems;
                            item.getChildByName("lblBet").getComponent(cc.Label).string = Utils.formatNumber(itemData["moneyBet"]);
                            item.getChildByName("lblMin").getComponent(cc.Label).string = Utils.formatNumber(itemData["requiredMoney"]);
                            item.getChildByName("lblPlayers").getComponent(cc.Label).string = itemData["userCount"] + "/" + itemData["maxUserPerRoom"];
                            item.getChildByName("sprPlayers").getComponent(cc.Sprite).fillRange = itemData["userCount"] / itemData["maxUserPerRoom"];
                            item.active = true;

                            item.on("click", () => {
                                App.instance.showLoading(true);
                                XocDiaNetworkClient.getInstance().send(new cmd.SendJoinRoomById(itemData["id"]));
                            });
                        }
                    }
                    break;
                case cmd.Code.JOIN_ROOM_FAIL:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceiveJoinRoomFail(data);
                        console.log(res);
                        let msg = "L???i " + res.getError() + ", kh??ng x??c ?????nh.";
                        switch (res.getError()) {
                            case 1:
                                msg = "L???i ki???m tra th??ng tin!";
                                break;
                            case 2:
                                msg = "Kh??ng t??m ???????c ph??ng th??ch h???p. Vui l??ng th??? l???i sau!";
                                break;
                            case 3:
                                msg = "B???n kh??ng ????? ti???n v??o ph??ng ch??i n??y!";
                                break;
                            case 4:
                                msg = "Kh??ng t??m ???????c ph??ng th??ch h???p. Vui l??ng th??? l???i sau!";
                                break;
                            case 5:
                                msg = "M???i l???n v??o ph??ng ph???i c??ch nhau 10 gi??y!";
                                break;
                            case 6:
                                msg = "H??? th???ng b???o tr??!";
                                break;
                            case 7:
                                msg = "Kh??ng t??m th???y ph??ng ch??i!";
                                break;
                            case 8:
                                msg = "M???t kh???u ph??ng ch??i kh??ng ????ng!";
                                break;
                            case 9:
                                msg = "Ph??ng ch??i ???? ????? ng?????i!";
                                break;
                            case 10:
                                msg = "B???n b??? ch??? ph??ng kh??ng cho v??o b??n!"
                        }
                        App.instance.alertDialog.showMsg(msg);
                    }
                    break;
                case cmd.Code.JOIN_ROOM_SUCCESS:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceiveJoinRoomSuccess(data);
                        console.log(res);
                        this.node.active = false;
                        XocDiaController.instance.play.show(res);
                    }
                    break;
                default:
                    console.log("--inpacket.getCmdId(): " + inpacket.getCmdId());
                    break;
            }
        }, this);

        this.itemTemplate.active = false;
    }

    public show() {
        this.node.active = true;
        this.actRefesh();
        BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
    }

    public actRefesh() {
        for (let i = 0; i < this.listItems.childrenCount; i++) {
            if (this.listItems.children[i] != this.itemTemplate) {
                this.listItems.children[i].destroy();
            }
        }
        XocDiaNetworkClient.getInstance().send(new cmd.SendGetListRoom());
    }

    public actBack() {
        XocDiaNetworkClient.getInstance().close();
        App.instance.loadScene("lobby");
    }

    public actCreateTable() {
        App.instance.alertDialog.showMsg("Kh??ng th??? t???o b??n trong game n??y.");
    }

    // update (dt) {}
}
