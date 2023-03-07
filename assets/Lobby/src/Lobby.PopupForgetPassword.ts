import Dialog from "../../scripts/common/Dialog";
import Http from "../../scripts/common/Http";
import Configs from "../../scripts/common/Configs";
import Utils from "../../scripts/common/Utils";
import App from "../../scripts/common/App";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopupForgetPassword extends Dialog {
    @property(cc.Node)
    info: cc.Node = null;
    @property(cc.Node)
    continue: cc.Node = null;

    @property(cc.EditBox)
    edbUsername: cc.EditBox = null;
    @property(cc.EditBox)
    edbCaptcha: cc.EditBox = null;
    @property(cc.Sprite)
    sprCaptcha: cc.Sprite = null;

    @property(cc.EditBox)
    edbOTP: cc.EditBox = null;
    @property(cc.Toggle)
    toggleAppOTP: cc.Toggle = null;

    private captchaId;

    show() {
        super.show();
        this.info.active = true;
        this.continue.active = false;
        this.toggleAppOTP.isChecked = false;
        this.edbCaptcha.string = "";
        this.edbUsername.string = "";
        this.edbOTP.string = "";
        this.actRefreshCaptcha();
    }

    public actRefreshCaptcha() {
        Http.get(Configs.App.API, { "c": 124 }, (err, res) => {
            if (err != null) {
                App.instance.alertDialog.showMsg("Xảy ra lỗi, vui lòng thử lại sau!");
                return;
            }
            this.captchaId = res["id"];
            Utils.loadSpriteFrameFromBase64(res["img"], (sprFrame) => {
                this.sprCaptcha.spriteFrame = sprFrame;
            });
        });
    }

    actSubmit() {
        let username = this.edbUsername.string.trim();
        let captcha = this.edbCaptcha.string.trim();
        if (username.length == 0) {
            App.instance.alertDialog.showMsg("Tên đăng nhập không được để trống.");
            return;
        }
        if (captcha.length == 0) {
            App.instance.alertDialog.showMsg("Mã xác thực không được để trống.");
            return;
        }
        Http.get(Configs.App.API, { "c": 127, "un": username, "cp": captcha, "cid": this.captchaId }, (err, res) => {
            if (err != null) {
                App.instance.alertDialog.showMsg("Xảy ra lỗi, vui lòng thử lại sau!");
                return;
            }
            // console.log(res);
            switch (res["errorCode"]) {
                case "115":
                    this.edbCaptcha.string = "";
                    this.actRefreshCaptcha();
                    App.instance.alertDialog.showMsg("Mã xác thực không chính xác.");
                    break;
                case "116":
                    App.instance.alertDialog.showMsg("Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút!");
                    this.edbCaptcha.string = "";
                    this.actRefreshCaptcha();
                    break;
                case "1001":
                    App.instance.alertDialog.showMsg("Kết nối mạng không ổn định. Vui lòng thử lại sau!");
                    this.actRefreshCaptcha();
                    break;
                case "1005":
                    App.instance.alertDialog.showMsg("Tài khoản không tồn tại.");
                    this.edbCaptcha.string = "";
                    this.actRefreshCaptcha();
                    break;
                case "2001":
                    App.instance.alertDialog.showMsg("Hệ thống không hỗ trợ các tài khoản chưa cập nhật Nickname!");
                    this.edbCaptcha.string = "";
                    this.actRefreshCaptcha();
                    break;
                case "1023":
                    this.info.active = false;
                    this.continue.active = true;
                    break;
                default:
                    App.instance.alertDialog.showMsg("Lỗi " + res["errorCode"] + ". Không xác định.");
                    this.edbCaptcha.string = "";
                    this.actRefreshCaptcha();
                    break;
            }
        });
    }

    actContinue() {
        let username = this.edbUsername.string.trim();
        let otp = this.edbOTP.string.trim();
        if (otp.length == 0) {
            App.instance.alertDialog.showMsg("Mã OTP không được để trống.");
            return;
        }
        Http.get(Configs.App.API, { "c": 128, "un": username, "otp": otp, "type": (this.toggleAppOTP.isChecked ? 1 : 0) }, (err, res) => {
            if (err != null) {
                App.instance.alertDialog.showMsg("Xảy ra lỗi, vui lòng thử lại sau!");
                return;
            }
            // console.log(res);
            if (!res["success"]) {
                switch (res["errorCode"]) {
                    case "1001":
                        App.instance.alertDialog.showMsg("Hệ thống tạm thời bị gián đoạn!");
                        break;
                    case "1008":
                        App.instance.alertDialog.showMsg("Mã OTP không chính xác!");
                        break;
                    case "1021":
                        App.instance.alertDialog.showMsg("Mã OTP đã hết hạn sử dụng!");
                        break;
                    case "1022":
                        App.instance.alertDialog.showMsg("Lỗi 1022, Mã OTP đã hết hạn sử dụng!");
                        break;
                    case "1114":
                        App.instance.alertDialog.showMsg("Hệ thống đang bảo trì. Vui lòng quay trở lại sau!");
                        break;
                    default:
                        App.instance.alertDialog.showMsg("Lỗi " + res["errorCode"] + ". Không xác định.");
                        break;
                }
                return;
            }
            this.dismiss();
            App.instance.alertDialog.showMsg("Hệ thống đã ghi nhận thông báo của quý khách. Hệ thống đang tiến hành kiểm tra và hỗ trợ trong vòng 24h. Vui lòng kiểm tra Email và số điện thoại đã kích hoạt bảo mật!");
        });
    }
}
