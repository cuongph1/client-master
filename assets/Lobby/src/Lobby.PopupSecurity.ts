import Dialog from "../../scripts/common/Dialog";
import MiniGameNetworkClient from "../../scripts/networks/MiniGameNetworkClient";
import InPacket from "../../scripts/networks/Network.InPacket";
import cmd from "./Lobby.Cmd";
import App from "../../scripts/common/App";
import Utils from "../../scripts/common/Utils";
import Configs from "../../scripts/common/Configs";
import BroadcastReceiver from "../../scripts/common/BroadcastReceiver";

const { ccclass, property } = cc._decorator;

@ccclass("Lobby.PopupSecurity.PanelSmsPlus")
export class PanelSmsPlus {
    @property(cc.Node)
    node: cc.Node = null;

    @property(cc.Node)
    info: cc.Node = null;
    @property(cc.Node)
    update: cc.Node = null;
    @property(cc.Node)
    continue: cc.Node = null;

    @property(cc.Label)
    infoLblUsername: cc.Label = null;
    @property(cc.Label)
    infoLblPhoneNumber: cc.Label = null;
    @property(cc.Button)
    infoBtnActive: cc.Button = null;
    @property(cc.Button)
    infoBtnChange: cc.Button = null;

    @property(cc.Node)
    updateBtnsActive: cc.Node = null;
    @property(cc.Node)
    updateBtnsNotActive: cc.Node = null;
    @property(cc.EditBox)
    updateEdbPhoneNumber: cc.EditBox = null;

    @property(cc.EditBox)
    continueEdbOTP: cc.EditBox = null;
}

@ccclass("Lobby.PopupSecurity.TabSafes")
export class TabSafes {
    @property(cc.Node)
    node: cc.Node = null;

    @property(cc.ToggleContainer)
    tabs: cc.ToggleContainer = null;
    @property(cc.Node)
    tabContents: cc.Node = null;

    @property(cc.Label)
    lblBalance: cc.Label = null;
    @property(cc.Label)
    lblBalanceSafes: cc.Label = null;

    @property(cc.EditBox)
    edbCoinNap: cc.EditBox = null;

    @property(cc.EditBox)
    edbCoinRut: cc.EditBox = null;
    @property(cc.EditBox)
    edbOTP: cc.EditBox = null;
    @property(cc.Toggle)
    toggleAppOTP: cc.Toggle = null;

    tabSelectedIdx = 0;

    start() {
        this.edbCoinRut.node.on("editing-did-ended", () => {
            let number = Utils.stringToInt(this.edbCoinRut.string);
            this.edbCoinRut.string = Utils.formatNumber(number);
        });
        this.edbCoinNap.node.on("editing-did-ended", () => {
            let number = Utils.stringToInt(this.edbCoinNap.string);
            this.edbCoinNap.string = Utils.formatNumber(number);
        });
        for (let i = 0; i < this.tabs.toggleItems.length; i++) {
            this.tabs.toggleItems[i].node.on("toggle", () => {
                this.tabSelectedIdx = i;
                this.onTabChanged();
            });
        }
    }

    onTabChanged() {
        for (let i = 0; i < this.tabContents.childrenCount; i++) {
            this.tabContents.children[i].active = i == this.tabSelectedIdx;
        }
        for (let j = 0; j < this.tabs.toggleItems.length; j++) {
            this.tabs.toggleItems[j].node.getComponentInChildren(cc.Label).node.color = j == this.tabSelectedIdx ? cc.Color.YELLOW : cc.Color.WHITE;
        }
        switch (this.tabSelectedIdx) {
            case 0:
                this.edbCoinNap.string = "";
                break;
            case 1:
                this.edbCoinRut.string = "";
                this.edbOTP.string = "";
                break;
        }
    }
}

@ccclass
export default class PopupSecurity extends Dialog {
    @property(cc.ToggleContainer)
    tabs: cc.ToggleContainer = null;
    @property(cc.Node)
    tabContents: cc.Node = null;
    @property(PanelSmsPlus)
    panelSmsPlus: PanelSmsPlus = null;
    @property(TabSafes)
    tabSafes: TabSafes = null;
    @property([cc.Label])
    lblContainsBotOTPs: cc.Label[] = [];

    private tabSelectedIdx = 0;
    private phoneNumber = "";
    private isMobileSecure = false;

    start() {
        for (let i = 0; i < this.lblContainsBotOTPs.length; i++) {
            let lbl = this.lblContainsBotOTPs[i];
            lbl.string = lbl.string.replace("$bot_otp", "@" + Configs.App.getLinkTelegram());
        }
        
        this.tabSafes.start();

        for (let i = 0; i < this.tabs.toggleItems.length; i++) {
            this.tabs.toggleItems[i].node.on("toggle", () => {
                this.tabSelectedIdx = i;
                this.onTabChanged();
            });
        }

        BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
            this.tabSafes.lblBalance.string = Utils.formatNumber(Configs.Login.Coin);
        }, this);

        MiniGameNetworkClient.getInstance().addListener((data) => {
            if (!this.node.active) return;
            let inpacket = new InPacket(data);
            // console.log(inpacket.getCmdId());
            switch (inpacket.getCmdId()) {
                case cmd.Code.GET_SECURITY_INFO: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResGetSecurityInfo(data);
                    if (this.panelSmsPlus.node.active) {
                        this.phoneNumber = res.mobile;
                        this.isMobileSecure = res.mobileSecure == 1;
                        if (res.mobile.length > 0) {
                            this.panelSmsPlus.info.active = true;
                            this.panelSmsPlus.update.active = false;
                            this.panelSmsPlus.continue.active = false;
                            this.panelSmsPlus.infoLblUsername.string = res.username;
                            this.panelSmsPlus.infoLblPhoneNumber.string = "*******" + this.phoneNumber.substring(this.phoneNumber.length - 3);
                            this.panelSmsPlus.infoBtnActive.node.active = !this.isMobileSecure;
                        } else {
                            this.panelSmsPlus.info.active = false;
                            this.panelSmsPlus.update.active = true;
                            this.panelSmsPlus.continue.active = false;
                        }
                        this.panelSmsPlus.updateBtnsActive.active = this.isMobileSecure;
                        this.panelSmsPlus.updateBtnsNotActive.active = !this.isMobileSecure;
                    }
                    if (this.tabSafes.node.active) {
                        this.tabSafes.lblBalanceSafes.string = Utils.formatNumber(res.safe);
                        this.tabSafes.lblBalance.string = Utils.formatNumber(Configs.Login.Coin);
                    }
                    // console.log(res);
                    break;
                }
                case cmd.Code.UPDATE_USER_INFO: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResUpdateUserInfo(data);
                    if (res.error != 0) {
                        switch (res.error) {
                            case 1:
                                App.instance.alertDialog.showMsg("K???t n???i m???ng kh??ng ???n ?????nh. Vui l??ng th??? l???i sau!");
                                break;
                            case 4:
                                App.instance.alertDialog.showMsg("S??? ??i???n tho???i kh??ng h???p l???!");
                                break;
                            case 5:
                            case 11:
                                App.instance.alertDialog.showMsg("S??? ??i???n tho???i ???? ???????c ????ng k?? b???i t??i kho???n kh??c!");
                                break;
                            default:
                                App.instance.alertDialog.showMsg("L???i " + res.error + ". Kh??ng x??c ?????nh.");
                                break;
                        }
                        return;
                    }
                    this.showSmsPlusContinue();
                    this.actSmsPlusActivePhone();
                    break;
                }
                case cmd.Code.CHANGE_PHONE_NUMBER: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResChangePhoneNumber(data);
                    if (res.error != 0) {
                        switch (res.error) {
                            case 1:
                                App.instance.alertDialog.showMsg("K???t n???i m???ng kh??ng ???n ?????nh. Vui l??ng th??? l???i sau!");
                                break;
                            case 2:
                                App.instance.alertDialog.showMsg("S??? ??i???n tho???i kh??ng h???p l???!");
                                break;
                            case 3:
                                App.instance.alertDialog.showMsg("S??? ??i???n tho???i m???i tr??ng v???i s??? ??i???n tho???i c??!");
                                break;
                            case 4:
                            case 5:
                                App.instance.alertDialog.showMsg("S??? ??i???n tho???i ???? ???????c ????ng k?? b???i t??i kho???n kh??c!");
                                break;
                            default:
                                App.instance.alertDialog.showMsg("L???i " + res.error + ". Kh??ng x??c ?????nh.");
                                break;
                        }
                        return;
                    }
                    this.showSmsPlusContinue();
                    App.instance.alertDialog.showMsg("Vui l??ng nh???p m?? OTP (S??? ??i???n tho???i c??) ????? ti???p t???c thay ?????i s??? ??i???n tho???i b???o m???t!");
                    break;
                }
                case cmd.Code.GET_OTP: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResGetOTP(data);
                    // console.log(res);
                    if (res.error == 0) {
                        App.instance.alertDialog.showMsg("M?? OTP ???? ???????c g???i ??i!");
                    } else if (res.error == 30) {
                        App.instance.alertDialog.showMsg("M???i thao t??c l???y SMS OTP ph???i c??ch nhau ??t nh???t 5 ph??t!");
                    } else {
                        App.instance.alertDialog.showMsg("Thao t??c kh??ng th??nh c??ng vui l??ng th??? l???i sau!");
                    }
                    break;
                }
                case cmd.Code.SEND_OTP: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResSendOTP(data);
                    // console.log(res);
                    if (res.error != 0) {
                        switch (res.error) {
                            case 1:
                            case 2:
                                App.instance.alertDialog.showMsg("Giao d???ch th???t b???i!");
                                break;
                            case 3:
                                App.instance.alertDialog.showMsg("M?? x??c th???c kh??ng ch??nh x??c, vui l??ng th??? l???i!");
                                break;
                            case 4:
                                App.instance.alertDialog.showMsg("M?? OTP ???? h???t h???n!");
                                break;
                            default:
                                App.instance.alertDialog.showMsg("L???i " + res.error + ". Kh??ng x??c ?????nh.");
                                break;
                        }
                        return;
                    }
                    break;
                }
                case cmd.Code.ACTIVE_PHONE: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResActivePhone(data);
                    switch (res.error) {
                        case 0:
                            this.showSmsPlusContinue();
                            break;
                        case 1:
                            App.instance.alertDialog.showMsg("K???t n???i m???ng kh??ng ???n ?????nh. Vui l??ng th??? l???i sau!");
                            break;
                        case 2:
                            App.instance.alertDialog.showMsg("S??? ??i???n tho???i ???? ???????c ????ng k?? b???i t??i kho???n kh??c!");
                            break;
                        default:
                            App.instance.alertDialog.showMsg("L???i " + res.error + ". Kh??ng x??c ?????nh.");
                            break;
                    }
                    break;
                }
                case cmd.Code.RESULT_ACTIVE_MOBILE: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResResultActiveMobie(data);
                    if (res.error == 0) {
                        App.instance.alertDialog.showMsg("K??ch ho???t b???o m???t th??nh c??ng!");
                        this.onTabChanged();
                    } else {
                        App.instance.alertDialog.showMsg("K??ch ho???t b???o m???t kh??ng th??nh c??ng!");
                    }
                    break;
                }
                case cmd.Code.RESULT_ACTIVE_NEW_MOBILE: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResResultActiveMobie(data);
                    if (res.error == 0) {
                        App.instance.alertDialog.showMsg("Thay ?????i s??? ??i???n tho???i v?? k??ch ho???t b???o m???t th??nh c??ng!");
                        this.onTabChanged();
                    } else {
                        App.instance.alertDialog.showMsg("Thao t??c kh??ng th??nh c??ng, vui l??ng th??? l???i sau!");
                    }
                    break;
                }
                case cmd.Code.RESULT_CHANGE_MOBILE_ACTIVED: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResResultActiveMobie(data);
                    if (res.error == 0) {
                        this.showSmsPlusContinue();
                        App.instance.alertDialog.showMsg("Vui l??ng nh???p m?? OTP (S??? ??i???n tho???i m???i) ????? ho??n t???t thay ?????i s??? ??i???n tho???i b???o m???t!");
                    } else {
                        App.instance.alertDialog.showMsg("Thao t??c kh??ng th??nh c??ng, vui l??ng th??? l???i sau!");
                    }
                    break;
                }
                case cmd.Code.SAFES: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResSafes(data);
                    switch (res.error) {
                        case 0:
                            if (this.tabSafes.tabSelectedIdx == 0) {
                                //nap
                            } else if (this.tabSafes.tabSelectedIdx == 1) {
                                //rut
                                App.instance.showLoading(true);
                                MiniGameNetworkClient.getInstance().send(new cmd.ReqSendOTP(this.tabSafes.edbOTP.string.trim(), this.tabSafes.toggleAppOTP.isChecked ? 1 : 0));
                            }
                            break;
                        case 1:
                            App.instance.alertDialog.showMsg("K???t n???i m???ng kh??ng ???n ?????nh. Vui l??ng th??? l???i sau!");
                            break;
                        case 2:
                            App.instance.alertDialog.showMsg("S??? d?? kh??ng ?????.");
                            break;
                        default:
                            App.instance.alertDialog.showMsg("L???i " + res.error + ". Kh??ng x??c ?????nh.");
                            break;
                    }
                    break;
                }
                case cmd.Code.RESULT_SAFES: {
                    App.instance.showLoading(false);
                    let res = new cmd.ResResultSafes(data);
                    // console.log(res);
                    switch (res.error) {
                        case 0:
                            if (this.tabSafes.tabSelectedIdx == 0) {
                                //nap
                                App.instance.alertDialog.showMsg("Thao t??c th??nh c??ng!");
                                this.tabSafes.lblBalanceSafes.string = Utils.formatNumber(res.safe);
                                this.tabSafes.edbCoinNap.string = "";
                                Configs.Login.Coin = res.currentMoney;
                                BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                            } else if (this.tabSafes.tabSelectedIdx == 1) {
                                //rut
                                App.instance.alertDialog.showMsg("Thao t??c th??nh c??ng!");
                                this.tabSafes.lblBalanceSafes.string = Utils.formatNumber(res.safe);
                                this.tabSafes.edbCoinRut.string = "";
                                this.tabSafes.edbOTP.string = "";
                                Configs.Login.Coin = res.currentMoney;
                                BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                            }
                            break;
                        default:
                            App.instance.alertDialog.showMsg("L???i " + res.error + ". Kh??ng x??c ?????nh.");
                            break;
                    }
                    break;
                }
            }
        }, this);
    }

    show() {
        super.show();
        this.tabSelectedIdx = 0;
        this.tabs.toggleItems[this.tabSelectedIdx].isChecked = true;
        this.onTabChanged();
    }

    actSmsPlusInfo() {
        this.panelSmsPlus.info.active = true;
        this.panelSmsPlus.update.active = false;
        this.panelSmsPlus.continue.active = false;
    }

    actSmsPlusUpdate() {
        this.panelSmsPlus.info.active = false;
        this.panelSmsPlus.update.active = true;
        this.panelSmsPlus.continue.active = false;
        this.panelSmsPlus.updateEdbPhoneNumber.string = "";
    }

    private showSmsPlusContinue() {
        this.panelSmsPlus.info.active = false;
        this.panelSmsPlus.update.active = false;
        this.panelSmsPlus.continue.active = true;
        this.panelSmsPlus.continueEdbOTP.string = "";
    }

    actSmsPlusSubmitUpdateUserInfo() {
        let phoneNumber = this.panelSmsPlus.updateEdbPhoneNumber.string.trim();
        if (phoneNumber.length == 0) {
            App.instance.alertDialog.showMsg("S??? ??i???n tho???i kh??ng ???????c b??? tr???ng.");
            return;
        }
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqUpdateUserInfo(phoneNumber));
    }

    actSmsPlusSubmitUpdatePhoneNumber() {
        let phoneNumber = this.panelSmsPlus.updateEdbPhoneNumber.string.trim();
        if (phoneNumber.length == 0) {
            App.instance.alertDialog.showMsg("S??? ??i???n tho???i kh??ng ???????c b??? tr???ng.");
            return;
        }
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqChangePhoneNumber(phoneNumber));
    }

    actSmsPlusSubmitContinuePhoneNumber() {
        let otp = this.panelSmsPlus.continueEdbOTP.string.trim();
        if (otp.length == 0) {
            App.instance.alertDialog.showMsg("M?? x??c th???c kh??ng ???????c b??? tr???ng.");
            return;
        }
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqSendOTP(otp, 0));
    }

    actSmsPlusActivePhone() {
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqActivePhone());
    }

    actSubmitSafesNap() {
        let coin = Utils.stringToInt(this.tabSafes.edbCoinNap.string);
        if (coin <= 0) {
            App.instance.alertDialog.showMsg("S??? ti???n giao d???ch kh??ng h???p l???.");
            return;
        }
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqSafes(coin, 1));
    }

    actSubmitSafesRut() {
        let coin = Utils.stringToInt(this.tabSafes.edbCoinRut.string);
        let otp = this.tabSafes.edbOTP.string;
        if (coin <= 0) {
            App.instance.alertDialog.showMsg("S??? ti???n giao d???ch kh??ng h???p l???.");
            return;
        }
        if (otp.length == 0) {
            App.instance.alertDialog.showMsg("M?? x??c th???c OTP kh??ng ???????c b??? tr???ng.");
            return;
        }
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqSafes(coin, 0));
    }

    actGetOTP() {
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqGetOTP());
    }

    actTelegram() {
        App.instance.openTelegram();
    }

    private onTabChanged() {
        for (let i = 0; i < this.tabContents.childrenCount; i++) {
            this.tabContents.children[i].active = i == this.tabSelectedIdx;
        }
        for (let j = 0; j < this.tabs.toggleItems.length; j++) {
            this.tabs.toggleItems[j].node.getComponentInChildren(cc.Label).node.color = j == this.tabSelectedIdx ? cc.Color.YELLOW : cc.Color.WHITE;
        }
        switch (this.tabSelectedIdx) {
            case 0:
                App.instance.showLoading(true);
                MiniGameNetworkClient.getInstance().send(new cmd.ReqGetSecurityInfo());
                break;
            case 1:
                App.instance.showLoading(true);
                MiniGameNetworkClient.getInstance().send(new cmd.ReqGetSecurityInfo());
                this.tabSafes.tabSelectedIdx = 0;
                this.tabSafes.tabs.toggleItems[this.tabSafes.tabSelectedIdx].isChecked = true;
                this.tabSafes.onTabChanged();
                break;
        }
    }
}
