import Dialog from "../../scripts/common/Dialog";
import Configs from "../../scripts/common/Configs";
import App from "../../scripts/common/App";
import Http from "../../scripts/common/Http";
import BroadcastReceiver from "../../scripts/common/BroadcastReceiver";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopupChangeAvatar extends Dialog {
    @property(cc.Node)
    items: cc.Node = null;
    @property(cc.Node)
    itemTemplate: cc.Node = null;

    private selectedIdx = -1;

    start() {
        for (let i = 0; i < App.instance.sprFrameAvatars.length; i++) {
            let item = cc.instantiate(this.itemTemplate);
            item.parent = this.items;
            item.getChildByName("sprite").getComponent(cc.Sprite).spriteFrame = App.instance.sprFrameAvatars[i];
            item.name = App.instance.sprFrameAvatars[i].name;
            if (App.instance.sprFrameAvatars[i].name == Configs.Login.Avatar) {
                this.selectedIdx = i;
                item.getChildByName("selected").active = true;
            } else {
                item.getChildByName("selected").active = false;
            }
            item.on("click", () => {
                this.selectedIdx = i;
                for (let j = 0; j < this.items.childrenCount; j++) {
                    let item = this.items.children[j];
                    item.getChildByName("selected").active = j == this.selectedIdx;
                }
            });
            this.selectedIdx = i;
        }
        this.itemTemplate.removeFromParent();
        this.itemTemplate = null;
    }

    show() {
        super.show();
        this.selectedIdx = -1;
        if (this.itemTemplate == null) {
            for (let i = 0; i < this.items.childrenCount; i++) {
                let item = this.items.children[i];
                if (item.name == Configs.Login.Avatar) {
                    this.selectedIdx = i;
                    item.getChildByName("selected").active = true;
                } else {
                    item.getChildByName("selected").active = false;
                }
            }
        }
    }

    actSubmit() {
        Http.get(Configs.App.API, { "c": 125, "nn": Configs.Login.Nickname, "avatar": App.instance.sprFrameAvatars[this.selectedIdx].name }, (err, res) => {
            if (err != null) {
                App.instance.alertDialog.showMsg("Xảy ra lỗi, vui lòng thử lại sau!");
                return;
            }
            if (!res["success"]) {
                switch (res["errorCode"]) {
                    default:
                        App.instance.alertDialog.showMsg("Lỗi " + res["errorCode"] + ". Không xác định.");
                        break;
                }
                return;
            }
            this.dismiss();
            Configs.Login.Avatar = App.instance.sprFrameAvatars[this.selectedIdx].name;
            BroadcastReceiver.send(BroadcastReceiver.USER_INFO_UPDATED);
            App.instance.alertDialog.showMsg("Thao tác thành công!");
        });
    }
}
