import App from "../../../scripts/common/App";
import Utils from "../../../scripts/common/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Player extends cc.Component {

    @property(cc.Button)
    btnInvite: cc.Button = null;
    @property(cc.Node)
    info: cc.Node = null;

    @property(cc.Label)
    lblNickname: cc.Label = null;
    @property(cc.Label)
    lblCoin: cc.Label = null;
    @property(cc.Sprite)
    sprAvatar: cc.Sprite = null;
    @property(cc.Node)
    winCoin: cc.Node = null;
    @property(cc.Node)
    refundCoin: cc.Node = null;
    @property(cc.Node)
    chipsPoint: cc.Node = null;
    @property(cc.Node)
    chipsPoint2: cc.Node = null;
    @property(cc.Node)
    banker: cc.Node = null;

    public nickname: string = "";
    public avatar: string = "";

    public leave() {
        this.nickname = "";

        if (this.btnInvite) this.btnInvite.node.active = true;
        if (this.info) this.info.active = false;
        this.winCoin.active = false;
        this.refundCoin.active = false;
        this.banker.active = false;
        this.unscheduleAllCallbacks();
    }

    public set(nickname: string, avatar: string, coin: number, isBanker: boolean) {
        this.nickname = nickname;
        this.lblNickname.string = nickname;
        this.sprAvatar.spriteFrame = App.instance.getAvatarSpriteFrame(avatar);
        this.setCoin(coin);
        this.banker.active = isBanker;

        if (this.btnInvite) this.btnInvite.node.active = false;
        if (this.info) this.info.active = true;
    }

    public setCoin(coin: number) {
        this.lblCoin.string = Utils.formatNumberMin(coin);
    }

    public showWinCoin(coin: number) {
        this.winCoin.active = true;
        this.winCoin.getComponentInChildren(cc.Label).string = "$ " + Utils.formatNumber(coin);
        this.scheduleOnce(() => {
            this.winCoin.active = false;
        }, 4);
    }

    public showRefundCoin(coin: number) {
        this.refundCoin.active = true;
        this.refundCoin.getComponentInChildren(cc.Label).string = "$ " + Utils.formatNumber(coin);
        this.scheduleOnce(() => {
            this.refundCoin.active = false;
        }, 4);
    }
}
