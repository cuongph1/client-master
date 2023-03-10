const { ccclass, property, requireComponent} = cc._decorator;

import LanguageManager from "./Language.LanguageManager";

namespace Language {
    @ccclass
    @requireComponent(cc.Label)
    export class Label extends cc.Component {

        @property
        id: string = "";

        start() {
            LanguageManager.instance.addListener(() => {
                this.updateText();
            }, this);
            this.updateText();
        }

        private updateText(){
            let str = LanguageManager.instance.getString(this.id);
            if(str != null && str.trim().length == 0){
                return;
            }
            this.getComponent(cc.Label).string = str;
        }
    }

}
export default Language.Label;