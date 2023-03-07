import Dialog from "../../../scripts/common/Dialog";
import App from "../../../scripts/common/App";
import Http from "../../../scripts/common/Http";
import Configs from "../../../scripts/common/Configs";
import Utils from "../../../scripts/common/Utils";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopupHonors extends Dialog {
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

    dismiss(){
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
        Http.get(Configs.App.API, { "c": 106, "mt": Configs.App.MONEY_TYPE, "p": this.page }, (err, res) => {
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
                        item.getChildByName("Time").getComponent(cc.Label).string = itemData["timestamp"];
                        item.getChildByName("Account").getComponent(cc.Label).string = itemData["username"];
                        item.getChildByName("Bet").getComponent(cc.Label).string = Utils.formatNumber(itemData["betValue"]);
                        item.getChildByName("Win").getComponent(cc.Label).string = Utils.formatNumber(itemData["prize"]);
                        switch (itemData.result) {
                            case 1:
                                item.getChildByName("Result").getComponent(cc.Label).string = "Nổ hũ";
                                break;
                            default:
                                item.getChildByName("Result").getComponent(cc.Label).string = "Thùng phá sảnh";
                                break
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
