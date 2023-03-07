import Dialog from "../../scripts/common/Dialog";
import App from "../../scripts/common/App";
import MiniGameNetworkClient from "../../scripts/networks/MiniGameNetworkClient";
import InPacket from "../../scripts/networks/Network.InPacket";
import cmd from "./Lobby.Cmd";

const { ccclass, property } = cc._decorator;

@ccclass
export default class PopupChangePassword extends Dialog {
    @property(cc.Node)
    info: cc.Node = null;
    @property(cc.Node)
    continue: cc.Node = null;

    @property(cc.EditBox)
    edbOldPassword: cc.EditBox = null;
    @property(cc.EditBox)
    edbNewPassword: cc.EditBox = null;
    @property(cc.EditBox)
    edbReNewPassword: cc.EditBox = null;

    @property(cc.EditBox)
    edbOTP: cc.EditBox = null;
    @property(cc.Toggle)
    toggleAppOTP: cc.Toggle = null;

    start() {
        MiniGameNetworkClient.getInstance().addListener((data) => {
            if (!this.node.active) return;
            let inpacket = new InPacket(data);
            // console.log(inpacket.getCmdId());
            switch (inpacket.getCmdId()) {
                case cmd.Code.CHANGE_PASSWORD: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResChangePassword(data);
                    switch (res.error) {
                        case 0:
                            App.instance.alertDialog.showMsg("Vui lòng nhấn \"Lấy OTP\" hoặc nhận OTP qua APP OTP, và nhập để tiếp tục.");
                            this.info.active = false;
                            this.continue.active = true;
                            break;
                        case 1:
                            App.instance.alertDialog.showMsg("Hệ thống đang tạm thời gián đoạn!");
                            break;
                        case 2:
                            App.instance.alertDialog.showMsg("Chức năng này dành cho các tài khoản đã đăng ký bảo mật SMS PLUS!");
                            break;
                        case 3:
                            App.instance.alertDialog.showMsg("Mật khẩu cũ không chính xác!");
                            break;
                        default:
                            App.instance.alertDialog.showMsg("Lỗi " + res.error + ". Không xác định.");
                            break;
                    }
                    break;
                }
                case cmd.Code.GET_OTP: {
                    if (!this.node.active) return;
                    App.instance.showLoading(false);
                    let res = new cmd.ResGetOTP(data);
                    // console.log(res);
                    if (res.error == 0) {
                        App.instance.alertDialog.showMsg("Mã OTP đã được gửi đi!");
                    } else if (res.error == 30) {
                        App.instance.alertDialog.showMsg("Mỗi thao tác lấy SMS OTP phải cách nhau ít nhất 5 phút!");
                    } else {
                        App.instance.alertDialog.showMsg("Thao tác không thành công vui lòng thử lại sau!");
                    }
                    break;
                }
                case cmd.Code.SEND_OTP: {
                    let res = new cmd.ResSendOTP(data);
                    // console.log(res);
                    App.instance.showLoading(false);
                    switch (res.error) {
                        case 0:
                            break;
                        case 1:
                        case 2:
                            App.instance.alertDialog.showMsg("Giao dịch thất bại!");
                            break;
                        case 77:
                        case 3:
                            App.instance.alertDialog.showMsg("Mã xác thực không chính xác, vui lòng thử lại!");
                            break;
                        case 4:
                            App.instance.alertDialog.showMsg("Mã OTP đã hết hạn!");
                            break;
                        default:
                            App.instance.alertDialog.showMsg("Lỗi " + res.error + ". Không xác định.");
                            break;
                    }
                    break;
                }
                case cmd.Code.RESULT_CHANGE_PASSWORD: {
                    let res = new cmd.ResSendOTP(data);
                    // console.log(res);
                    App.instance.showLoading(false);
                    switch (res.error) {
                        case 0:
                            App.instance.alertDialog.showMsg("Thay đổi mật khẩu thành công.");
                            this.dismiss();
                            break;
                        default:
                            App.instance.alertDialog.showMsg("Lỗi " + res.error + ". Không xác định.");
                            break;
                    }
                    break;
                }
            }
        }, this);
    }

    show() {
        super.show();
        this.info.active = true;
        this.continue.active = false;
        this.toggleAppOTP.isChecked = false;
        this.edbOldPassword.string = "";
        this.edbNewPassword.string = "";
        this.edbReNewPassword.string = "";
        this.edbOTP.string = "";
    }

    actSubmit() {
        let oldPassword = this.edbOldPassword.string.trim();
        let newPassword = this.edbNewPassword.string.trim();
        let reNewPassword = this.edbReNewPassword.string.trim();
        if (oldPassword.length == 0) {
            App.instance.alertDialog.showMsg("Mật khẩu cũ không được để trống.");
            return;
        }
        if (newPassword.length == 0) {
            App.instance.alertDialog.showMsg("Mật khẩu mới không được để trống.");
            return;
        }
        if (reNewPassword != newPassword) {
            App.instance.alertDialog.showMsg("Hai mật khẩu mới không giống nhau.");
            return;
        }
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqChangePassword(oldPassword, newPassword));
    }

    actGetOTP() {
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqGetOTP());
    }

    actContinue() {
        let otp = this.edbOTP.string.trim();
        if (otp.length == 0) {
            App.instance.alertDialog.showMsg("Mã OTP không được bỏ trống.");
            return;
        }
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqSendOTP(otp, this.toggleAppOTP.isChecked ? 1 : 0));
    }
}
