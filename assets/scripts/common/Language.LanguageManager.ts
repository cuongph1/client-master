// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

namespace Language {
    @ccclass
    export class LanguageMananger extends cc.Component {

        static instance: LanguageMananger = null;

        @property(cc.TextAsset)
        json: cc.TextAsset = null;

        languageCode = "vi";
        private texts: Object = {};
        private listeners: Array<any> = [];

        onLoad() {
            LanguageMananger.instance = this;
            this.texts = JSON.parse(this.json.text);
        }

        public setLanguage(languageCode: string) {
            this.languageCode = languageCode;
            for (var i = 0; i < this.listeners.length; i++) {
                var listener = this.listeners[i];
                if (listener.target && listener.target instanceof Object && listener.target.node) {
                    listener.callback(languageCode);
                } else {
                    this.listeners.splice(i, 1);
                    i--;
                }
            }
        }

        public addListener(callback: (languageCode: string) => void, target: cc.Component) {
            this.listeners.push({
                callback: callback,
                target: target
            });
        }

        public getString(id: string): string {
            if (this.texts.hasOwnProperty(id)) {
                if (this.texts[id].hasOwnProperty(this.languageCode)) {
                    return this.texts[id][this.languageCode];
                }
            }
            return id;
        }
    }

}
export default Language.LanguageMananger;