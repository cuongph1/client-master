import Utils from "../../../scripts/common/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BtnPayBet extends cc.Component {

    @property(cc.Label)
    lblTotalBet: cc.Label = null;
    @property(cc.Node)
    active: cc.Node = null;

    public reset() {
        this.lblTotalBet.string = "";
        this.active.active = false;
    }

    public setTotalBet(coin: number) {
        this.lblTotalBet.string = coin > 0 ? Utils.formatNumberMin(coin) : "";
    }
}
