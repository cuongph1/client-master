import Dialog from "../../scripts/common/Dialog";
import App from "../../scripts/common/App";
import Http from "../../scripts/common/Http";
import Configs from "../../scripts/common/Configs";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Popupnaprut extends Dialog {



    show() {
        super.show();
        for (let i = 0; i < this.itemTemplate.parent.childrenCount; i++) {
            this.itemTemplate.parent.children[i].active = false;
        }
    }

    dismiss() {
        super.dismiss();
        for (let i = 0; i < this.itemTemplate.parent.childrenCount; i++) {
            this.itemTemplate.parent.children[i].active = false;
        }
    }



    private getItem(): cc.Node {
        let item = null;
        for (let i = 0; i < this.itemTemplate.parent.childrenCount; i++) {
            let node = this.itemTemplate.parent.children[i];
            if (node != this.itemTemplate && !node.active) {
                item = node;
                break;
            }
        }
        if (item == null) {
            item = cc.instantiate(this.itemTemplate);
            item.parent = this.itemTemplate.parent;
        }
        item.active = true;
        return item;
    }


                }
            }
        });
    }
}
