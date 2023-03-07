import MiniGame from "../../../Lobby/src/MiniGame";
import TaiXiuMiniController from "../TaiXiuMini/src/TaiXiuMini.TaiXiuMiniController";
import TaiXiuMini2Controller from "../TaiXiuMini2/src/TaiXiuMini2.TaiXiuMiniController";
import TX2NetworkClient from "../../../scripts/networks/TX2NetworkClient";
import App from "../../../scripts/common/App";
import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";
import MiniGameNetworkClient from "../../../scripts/networks/MiniGameNetworkClient";
import VersionConfig from "../../../scripts/common/VersionConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TaiXiuDoubleController extends MiniGame {

    static instance: TaiXiuDoubleController = null;

    @property(TaiXiuMiniController)
    taiXiu1Node: cc.Node = null;

    @property(cc.Node)
    taiXiu2Node: cc.Node = null;

    @property(cc.Node)
    btnSwitch: cc.Node = null;

    taiXiu1: TaiXiuMiniController = null;
    taiXiu2: TaiXiuMini2Controller = null;

    private isShowTX1 = true;

    public onLoad() {
        super.onLoad();
        this.taiXiu1 = this.taiXiu1Node.getComponent(TaiXiuMiniController);
        this.taiXiu2 = this.taiXiu2Node.getComponent(TaiXiuMini2Controller);
        TaiXiuDoubleController.instance = this;

        switch (VersionConfig.CPName) {
            case VersionConfig.CP_NAME_F69:
                this.btnSwitch.active = false;
                this.taiXiu2.node.active = false;
                break;
            default:
                this.btnSwitch.active = true;
                this.taiXiu2.node.active = true;
                break;
        }
    }

    public start() {
        BroadcastReceiver.register(BroadcastReceiver.USER_LOGOUT, () => {
            if (!this.node.active) return;
            this.dismiss();
        }, this);

        MiniGameNetworkClient.getInstance().addOnClose(() => {
            if (!this.node.active) return;
            this.dismiss();
        }, this);

        TX2NetworkClient.getInstance().addOnClose(() => {
            if (!this.node.active) return;
            this.dismiss();
        }, this);
    }

    public show() {
        super.show();

        this.isShowTX1 = true;

        switch (VersionConfig.CPName) {
            case VersionConfig.CP_NAME_F69:
                //nothing
                break;
            default:
                TX2NetworkClient.getInstance().checkConnect(() => {
                    this.taiXiu2.show();
                    this.checkShow();
                });
                break;
        }

        MiniGameNetworkClient.getInstance().checkConnect(() => {
            this.taiXiu1.show();
            this.checkShow();
        });
        App.instance.buttonMiniGame.showTimeTaiXiu(false);
        this.checkShow();
    }

    public dismiss() {
        super.dismiss();
        App.instance.buttonMiniGame.showTimeTaiXiu(true);
        this.taiXiu1.dismiss();

        switch (VersionConfig.CPName) {
            case VersionConfig.CP_NAME_F69:
                //nothing
                break;
            default:
                this.taiXiu2.dismiss();
                break;
        }
    }

    private checkShow() {
        if (this.isShowTX1) {
            this.taiXiu1.gamePlay.scale = 1;
            this.taiXiu1.gamePlay.position = cc.Vec2.ZERO;
            this.taiXiu1.nodePanelChat.active = true;
            this.taiXiu1.node.setSiblingIndex(1);

            this.taiXiu2.gamePlay.scale = 0.5;
            this.taiXiu2.gamePlay.position = cc.v2(-405, 234);
            this.taiXiu2.nodePanelChat.active = false;
            this.taiXiu2.layoutBet.active = false;
        } else {
            this.taiXiu2.gamePlay.scale = 1;
            this.taiXiu2.gamePlay.position = cc.Vec2.ZERO;
            this.taiXiu2.nodePanelChat.active = true;
            this.taiXiu2.node.setSiblingIndex(1);

            this.taiXiu1.gamePlay.scale = 0.5;
            this.taiXiu1.gamePlay.position = cc.v2(-405, 234);
            this.taiXiu1.nodePanelChat.active = false;
            this.taiXiu1.layoutBet.active = false;
        }
    }

    public actSwitch() {
        this.isShowTX1 = !this.isShowTX1;
        this.checkShow();
    }
}
