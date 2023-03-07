import Dialog from "../../scripts/common/Dialog";
import Http from "../../scripts/common/Http";
import Configs from "../../scripts/common/Configs";
import App from "../../scripts/common/App";
import Utils from "../../scripts/common/Utils";
import BroadcastReceiver from "../../scripts/common/BroadcastReceiver";
import PopupUpdateNickname from "./PopupUpdateNickname";

const { ccclass, property } = cc._decorator;

namespace Lobby {

    @ccclass
    export class PopupRegister extends Dialog {

        @property(PopupUpdateNickname)
        popupUpdateNickname: PopupUpdateNickname = null;
        @property(cc.EditBox)
        edbUsername: cc.EditBox = null;
        @property(cc.EditBox)
        edbPassword: cc.EditBox = null;
        @property(cc.EditBox)
        edbRePassword: cc.EditBox = null;
        @property(cc.EditBox)
        edbCaptcha: cc.EditBox = null;
        @property(cc.Sprite)
        sprCaptcha: cc.Sprite = null;

        private captchaId: string = "";

        show() {
            super.show();
            this.refreshCaptcha();
        }

        public actRegister() {
            let _this = this;
            let username = this.edbUsername.string.trim();
            let password = this.edbPassword.string;
            let rePassword = this.edbRePassword.string;
            let captcha = this.edbCaptcha.string;

            if (username.length == 0) {
                App.instance.alertDialog.showMsg("Tên đăng nhập không được để trống.");
                return;
            }

            if (password.length == 0) {
                App.instance.alertDialog.showMsg("Mật khẩu không được để trống.");
                return;
            }

            if (password != rePassword) {
                App.instance.alertDialog.showMsg("Hai mật khẩu không khớp.");
                return;
            }

            if (captcha.length == 0) {
                App.instance.alertDialog.showMsg("Mã xác thực không được để trống.");
                return;
            }

            App.instance.showLoading(true);
            let reqParams = { "c": 1, "un": username, "pw": md5(password), "cp": captcha, "cid": this.captchaId };
            if (cc.sys.isNative && cc.sys.os == cc.sys.OS_IOS) {
                reqParams["utm_source"] = "IOS";
                reqParams["utm_medium"] = "IOS";
                reqParams["utm_term"] = "IOS";
                reqParams["utm_content"] = "IOS";
                reqParams["utm_campaign"] = "IOS";
            } else if (cc.sys.isNative && cc.sys.os == cc.sys.OS_ANDROID) {
                reqParams["utm_source"] = "ANDROID";
                reqParams["utm_medium"] = "ANDROID";
                reqParams["utm_term"] = "ANDROID";
                reqParams["utm_content"] = "ANDROID";
                reqParams["utm_campaign"] = "ANDROID";
            }
            Http.get(Configs.App.API, reqParams, (err, res) => {
                App.instance.showLoading(false);
                if (err != null) {
                    App.instance.alertDialog.showMsg("Xảy ra lỗi, vui lòng thử lại sau!");
                    return;
                }
                // console.log(res);
                if (!res["success"]) {
                    switch (parseInt(res["errorCode"])) {
                        case 1001:
                            App.instance.alertDialog.showMsg("Kết nối mạng không ổn định, vui lòng thử lại sau.");
                            _this.refreshCaptcha();
                            break;
                        case 101:
                            App.instance.alertDialog.showMsg("Tên đăng nhập không hợp lệ.");
                            _this.refreshCaptcha();
                            break;
                        case 1006:
                            App.instance.alertDialog.showMsg("Tài khoản đã tồn tại.");
                            _this.refreshCaptcha();
                            break;
                        case 102:
                            App.instance.alertDialog.showMsg("Mật khẩu không hợp lệ.");
                            _this.refreshCaptcha();
                            break;
                        case 108:
                            App.instance.alertDialog.showMsg("Mật khẩu không được trùng với tên đăng nhập.");
                            _this.refreshCaptcha();
                            break;
                        case 115:
                            App.instance.alertDialog.showMsg("Mã xác nhận không chính xác.");
                            break;
                        case 1114:
                            App.instance.alertDialog.showMsg("Hệ thống đang bảo trì. Vui lòng quay trở lại sau!");
                            _this.refreshCaptcha();
                            break;
                        default:
                            App.instance.alertDialog.showMsg("Xảy ra lỗi, vui lòng thử lại sau!");
                            break;
                    }
                    return;
                }
                _this.dismiss();
                _this.popupUpdateNickname.show2(username, password);
            });
        }

        public refreshCaptcha() {
            var _this = this;
            Http.get(Configs.App.API, { "c": 124 }, (err, res) => {
                if (err != null) {
                    App.instance.alertDialog.showMsg("Xảy ra lỗi, vui lòng thử lại sau!");
                    return;
                }
                _this.captchaId = res["id"];
                Utils.loadSpriteFrameFromBase64(res["img"], (sprFrame) => {
                    _this.sprCaptcha.spriteFrame = sprFrame;
                });
            });
        }
    }
}
export default Lobby.PopupRegister;
