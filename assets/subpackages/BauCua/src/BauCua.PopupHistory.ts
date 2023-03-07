import Dialog from "../../../scripts/common/Dialog";
import Configs from "../../../scripts/common/Configs";
import App from "../../../scripts/common/App";
import Http from "../../../scripts/common/Http";
import Utils from "../../../scripts/common/Utils";
import BauCuaController from "./BauCua.BauCuaController";

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
        Http.get(Configs.App.API, { "c": 121, "mt": Configs.App.MONEY_TYPE, "p": this.page, "un": Configs.Login.Nickname }, (err, res) => {
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
                    if (i < res["transactions"].length) {
                        let itemData = res["transactions"][i];
                        item.getChildByName("bg").opacity = i % 2 == 0 ? 10 : 0;
                        item.getChildByName("Session").getComponent(cc.Label).string = "#" + itemData["referenceId"];
                        item.getChildByName("Time").getComponent(cc.Label).string = itemData["timestamp"];

                        let betValues = itemData["betValues"][0] + itemData["betValues"][1] + itemData["betValues"][2] + itemData["betValues"][3] + itemData["betValues"][4] + itemData["betValues"][5];
                        item.getChildByName("Bet").getComponent(cc.Label).string = Utils.formatNumber(betValues);

                        let prizes = itemData["prizes"][0] + itemData["prizes"][1] + itemData["prizes"][2] + itemData["prizes"][3] + itemData["prizes"][4] + itemData["prizes"][5];
                        item.getChildByName("Win").getComponent(cc.Label).string = Utils.formatNumber(prizes);

                        let dices = itemData["dices"].split(",");
                        let result = item.getChildByName("Result");
                        result.children[0].getComponent(cc.Sprite).spriteFrame = BauCuaController.instance.sprSmallDices[dices[0]];
                        result.children[1].getComponent(cc.Sprite).spriteFrame = BauCuaController.instance.sprSmallDices[dices[1]];
                        result.children[2].getComponent(cc.Sprite).spriteFrame = BauCuaController.instance.sprSmallDices[dices[2]];
                        item.active = true;
                    } else {
                        item.active = false;
                    }
                }
            }
        });
    }
}
