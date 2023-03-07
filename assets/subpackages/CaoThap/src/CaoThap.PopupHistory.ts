import Dialog from "../../../scripts/common/Dialog";
import Configs from "../../../scripts/common/Configs";
import App from "../../../scripts/common/App";
import Http from "../../../scripts/common/Http";
import Utils from "../../../scripts/common/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopupHistory extends Dialog {
    @property(cc.Label)
    lblPage: cc.Label = null;
    @property(cc.Node)
    itemTemplate: cc.Node = null;

    private page: number = 1;
    private maxPage: number = 1;
    private items = new Array<cc.Node>();

    show() {
        super.show();

        for (let i = 0; i < this.items.length; i++) {
            this.items[i].active = false;
        }
        if (this.itemTemplate != null) this.itemTemplate.active = false;


    }

    dismiss() {
        super.dismiss();
        for (let i = 0; i < this.items.length; i++) {
            this.items[i].active = false;
        }
    }

    _onShowed() {
        super._onShowed();
        this.page = 1;
        this.maxPage = 1;
        this.lblPage.string = this.page + "/" + this.maxPage;
        this.loadData();
    }

    actNextPage() {
        if (this.page < this.maxPage) {
            this.page++;
            this.lblPage.string = this.page + "/" + this.maxPage;
            this.loadData();
        }
    }

    actPrevPage() {
        if (this.page > 1) {
            this.page--;
            this.lblPage.string = this.page + "/" + this.maxPage;
            this.loadData();
        }
    }

    private loadData() {
        App.instance.showLoading(true);
        Http.get(Configs.App.API, { "c": 107, "mt": Configs.App.MONEY_TYPE, "p": this.page, "nn": Configs.Login.Nickname }, (err, res) => {
            App.instance.showLoading(false);
            if (err != null) return;
            if (res["success"]) {

                if (this.items.length == 0) {
                    for (var i = 0; i < 10; i++) {
                        let item = cc.instantiate(this.itemTemplate);
                        item.parent = this.itemTemplate.parent;
                        this.items.push(item);
                    }
                    this.itemTemplate.destroy();
                    this.itemTemplate = null;
                }

                this.maxPage = res["totalPages"];
                this.lblPage.string = this.page + "/" + this.maxPage;
                for (let i = 0; i < this.items.length; i++) {
                    let item = this.items[i];
                    if (i < res["results"].length) {
                        let itemData = res["results"][i];
                        item.getChildByName("bg").opacity = i % 2 == 0 ? 10 : 0;
                        item.getChildByName("Session").getComponent(cc.Label).string = itemData["transId"];
                        item.getChildByName("Time").getComponent(cc.Label).string = itemData["timestamp"];
                        item.getChildByName("Bet").getComponent(cc.Label).string = Utils.formatNumber(itemData["betValue"]);
                        item.getChildByName("Result").getComponent(cc.Label).string = itemData["cards"];
                        item.getChildByName("Win").getComponent(cc.Label).string = Utils.formatNumber(itemData["prize"]);
                        item.getChildByName("Step").getComponent(cc.Label).string = Utils.formatNumber(itemData["step"]);
                        if (itemData["step"] == 1) {
                            item.getChildByName("BetDoor").getComponent(cc.Label).string = "";
                        } else {
                            item.getChildByName("BetDoor").getComponent(cc.Label).string = itemData["potBet"] == 0 ? "Dưới" : "Trên";
                        }
                        item.active = true;
                    } else {
                        item.active = false;
                    }
                }
            }
        });
    }
}
