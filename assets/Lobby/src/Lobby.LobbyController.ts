import { debug } from './../../../creator.d';
import App from "../../scripts/common/App";
import Http from "../../scripts/common/Http";
import Configs from "../../scripts/common/Configs";
import MiniGameNetworkClient from "../../scripts/networks/MiniGameNetworkClient";
import BroadcastReceiver from "../../scripts/common/BroadcastReceiver";
import SPUtils from "../../scripts/common/SPUtils";
import Tween from "../../scripts/common/Tween";
import SlotNetworkClient from "../../scripts/networks/SlotNetworkClient";
import TienLenNetworkClient from "../../scripts/networks/TienLenNetworkClient";
import SamNetworkClient from "../../scripts/networks/SamNetworkClient";
import PopupGiftCode from "./Lobby.PopupGiftCode";
import cmd from "./Lobby.Cmd";
import InPacket from "../../scripts/networks/Network.InPacket";
import TabsListGame from "./Lobby.TabsListGame";
import PopupUpdateNickname from "./PopupUpdateNickname";
import PopupLuckyWheel from "./Lobby.PopupLuckyWheel";
import PopupTransaction from "./Lobby.PopupTransaction";
import PopupSecurity from "./Lobby.PopupSecurity";
import Utils from "../../scripts/common/Utils";
import ButtonListJackpot from "./Lobby.ButtonListJackpot";
import PopupBoomTan from "./Lobby.PopupBoomTan";
import VersionConfig from "../../scripts/common/VersionConfig";
import ShootFishNetworkClient from "../../scripts/networks/ShootFishNetworkClient";
import Dialog from "../../scripts/common/Dialog";
import AudioManager from "../../scripts/common/Common.AudioManager";
import PopupDaiLy from "./Lobby.PopupDaiLy";
import Popupnaprut from "./Lobby.Popupnaprut";
import { Tophudata } from './Lobby.ItemTopHu';
import TopHu from "./Lobby.TopHu";
const { ccclass, property } = cc._decorator;

@ccclass("Lobby.LobbyController.PanelMenu")
export class PanelMenu {
    @property(cc.Node)
    node: cc.Node = null;
    @property(cc.Toggle)
    toggleMusic: cc.Toggle = null;
    @property(cc.Toggle)
    toggleSound: cc.Toggle = null;

    private animate = false;

    start() {
        this.toggleMusic.node.on("toggle", () => {
            SPUtils.setMusicVolumn(this.toggleMusic.isChecked ? 1 : 0);
            BroadcastReceiver.send(BroadcastReceiver.ON_AUDIO_CHANGED);
        });
        this.toggleSound.node.on("toggle", () => {
            SPUtils.setSoundVolumn(this.toggleSound.isChecked ? 1 : 0);
            BroadcastReceiver.send(BroadcastReceiver.ON_AUDIO_CHANGED);
        });
        this.toggleMusic.isChecked = SPUtils.getMusicVolumn() > 0;
        this.toggleSound.isChecked = SPUtils.getSoundVolumn() > 0;
        this.node.active = false;
    }

    show() {
        if (this.animate) return;
        this.animate = true;
        this.node.stopAllActions();
        this.node.active = true;
        this.node.scaleY = 0;
        this.node.runAction(cc.sequence(
            cc.scaleTo(0.2, 1).easing(cc.easeBackOut()),
            cc.callFunc(() => {
                this.animate = false;
            })
        ));
    }

    dismiss() {
        if (this.animate) return;
        this.animate = true;
        this.node.stopAllActions();
        this.node.runAction(cc.sequence(
            cc.scaleTo(0.2, 1, 0).easing(cc.easeBackIn()),
            cc.callFunc(() => {
                this.node.active = false;
                this.animate = false;
            })
        ));
    }

    toggle() {
        if (this.node.active) {
            this.dismiss();
        } else {
            this.show();
        }
    }
}

namespace Lobby {
    @ccclass
    export class LobbyController extends cc.Component {

        @property(cc.Node)
        panelNotLogin: cc.Node = null;
        @property(cc.Node)
        panelLogined: cc.Node = null;
        @property(PanelMenu)
        panelMenu: PanelMenu = null;
        @property(cc.EditBox)
        edbUsername: cc.EditBox = null;
        @property(cc.EditBox)
        edbPassword: cc.EditBox = null;
        @property(cc.Sprite)
        sprAvatar: cc.Sprite = null;
        @property(cc.Label)
        lblNickname: cc.Label = null;
        @property(cc.Label)
        lblVipPoint: cc.Label = null;
        @property(cc.Slider)
        sliderVipPoint: cc.Slider = null;
        @property(cc.Label)
        lblVipPointName: cc.Label = null;
        @property(cc.Sprite)
        spriteProgressVipPoint: cc.Sprite = null;
        @property(cc.Label)
        lblCoin: cc.Label = null;
        @property(cc.Label)
        lblCoinFish: cc.Label = null;
        @property(cc.RichText)
        txtNotifyMarquee: cc.RichText = null;
        @property(ButtonListJackpot)
        buttonListJackpot: ButtonListJackpot = null;
        @property(cc.Node)
        panelSupport: cc.Node = null;

        @property(TabsListGame)
        tabsListGame: TabsListGame = null;

        @property(PopupGiftCode)
        popupGiftCode: PopupGiftCode = null;
        @property(PopupUpdateNickname)
        popupUpdateNickname: PopupUpdateNickname = null;
        @property(PopupLuckyWheel)
        popupLuckyWheel: PopupLuckyWheel = null;
        @property(PopupTransaction)
        popupTransaction: PopupTransaction = null;
        @property(PopupSecurity)
        popupSecurity: PopupSecurity = null;
        @property(PopupBoomTan)
        popupBoomTan: PopupBoomTan = null;

        @property(PopupDaiLy)
        popupDaily: PopupDaiLy = null;
        @property(Popupnaprut)
        Popupnaprut: Popupnaprut = null;
        @property(Dialog)
        popupEventLogin: Dialog = null;

        @property(cc.Node)
        logos: cc.Node = null;

        @property({ type: cc.AudioClip })
        clipBgm: cc.AudioClip = null;
        @property(TopHu)
        topHu: TopHu = null;

        listData100: Array<Tophudata> = new Array<Tophudata>();
        listData1000: Array<Tophudata> = new Array<Tophudata>();
        listData10000: Array<Tophudata> = new Array<Tophudata>();
        private static notifyMarquee = "";

        start() {
            console.log("CPName: " + VersionConfig.CPName);
            console.log("VersionName: " + VersionConfig.VersionName);

            this.lblCoin.node.parent.active = true;
            this.lblCoinFish.node.parent.active = false;

            // for (let i = 0; i < this.logos.childrenCount; i++) {
            //     this.logos.children[i].active = this.logos.children[i].name == VersionConfig.CPName;
            // }

            this.panelMenu.start();

            BroadcastReceiver.register(BroadcastReceiver.UPDATE_NICKNAME_SUCCESS, (data) => {
                this.edbUsername.string = data["username"];
                this.edbPassword.string = data["password"];
                this.actLogin();
            }, this);

            BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
                Tween.numberTo(this.lblCoin, Configs.Login.Coin, 0.3);
                Tween.numberTo(this.lblCoinFish, Configs.Login.CoinFish, 0.3);
            }, this);

            BroadcastReceiver.register(BroadcastReceiver.USER_INFO_UPDATED, () => {
                this.lblNickname.string = Configs.Login.Nickname;
                this.sprAvatar.spriteFrame = App.instance.getAvatarSpriteFrame(Configs.Login.Avatar);
                this.lblVipPoint.string = "VP: " + Utils.formatNumber(Configs.Login.VipPoint) + "/" + Utils.formatNumber(Configs.Login.getVipPointNextLevel());
                this.sliderVipPoint.progress = Math.min(Configs.Login.VipPoint / Configs.Login.getVipPointNextLevel(), 1);
                this.spriteProgressVipPoint.fillRange = this.sliderVipPoint.progress;
                this.lblVipPointName.string = Configs.Login.getVipPointName();
                Tween.numberTo(this.lblCoin, Configs.Login.Coin, 0.3);
                Tween.numberTo(this.lblCoinFish, Configs.Login.CoinFish, 0.3);
            }, this);

            BroadcastReceiver.register(BroadcastReceiver.USER_LOGOUT, (data) => {
                Configs.Login.clear();
                this.panelNotLogin.active = true;
                this.panelLogined.active = false;
                this.edbUsername.string = SPUtils.getUserName();
                this.edbPassword.string = SPUtils.getUserPass();
                MiniGameNetworkClient.getInstance().close();
                SlotNetworkClient.getInstance().close();
                TienLenNetworkClient.getInstance().close();
                ShootFishNetworkClient.getInstance().close();
                App.instance.buttonMiniGame.hidden();
            }, this);

            this.edbUsername.string = SPUtils.getUserName();
            this.edbPassword.string = SPUtils.getUserPass();

            let moveAndCheck = () => {
                this.txtNotifyMarquee.node.runAction(cc.sequence(
                    cc.moveBy(0.5, cc.v2(-60, 0)),
                    cc.callFunc(() => {
                        if (this.txtNotifyMarquee.node.position.x < -this.txtNotifyMarquee.node.width - 50) {
                            this.txtNotifyMarquee.string = LobbyController.notifyMarquee;
                            // this.notifyMarquee = "";
                            let pos = this.txtNotifyMarquee.node.position;
                            pos.x = this.txtNotifyMarquee.node.parent.width + 50;
                            this.txtNotifyMarquee.node.position = pos;
                        }
                        moveAndCheck();
                    })
                ));
            };
            let pos = this.txtNotifyMarquee.node.position;
            pos.x = this.txtNotifyMarquee.node.parent.width + 50;
            this.txtNotifyMarquee.node.position = pos;
            this.txtNotifyMarquee.string = LobbyController.notifyMarquee;
            moveAndCheck();

            if (!Configs.Login.IsLogin) {
                if (this.edbUsername.string.length > 0 && this.edbPassword.string.length > 0) {
                    this.actLogin();
                }
                this.panelNotLogin.active = true;
                this.panelLogined.active = false;
                App.instance.buttonMiniGame.hidden();

                //fake jackpot
                var j100 = Utils.randomRangeInt(5000, 7000) * 100;
                var j1000 = Utils.randomRangeInt(5000, 7000) * 1000;
                var j10000 = Utils.randomRangeInt(5000, 7000) * 10000;
                // //
                this.tabsListGame.updateItemJackpots("audition", j100, false, j1000, false, j10000, false);
                this.tabsListGame.updateItemJackpots("captain", j100, false, j1000, false, j10000, false);
                this.tabsListGame.updateItemJackpots("spartans", j100, false, j1000, false, j10000, false);
                this.tabsListGame.updateItemJackpots("tamhung", j100, false, j1000, false, j10000, false);
                this.tabsListGame.updateItemJackpots("aztec", j100, false, j1000, false, j10000, false);
                this.tabsListGame.updateItemJackpots("zeus", j100, false, j1000, false, j10000, false);
                this.tabsListGame.updateItemJackpots("gainhay", j100, false, j1000, false, j10000, false);
                this.tabsListGame.updateItemJackpots("shootfish", j100, false, j1000, false, j10000, false);
                this.createListdata(j100, j1000, j10000)
                this.topHu.ShowData(this.listData100, this.listData1000, this.listData10000);
            } else {
                this.panelNotLogin.active = false;
                this.panelLogined.active = true;
                BroadcastReceiver.send(BroadcastReceiver.USER_INFO_UPDATED);
                SlotNetworkClient.getInstance().sendCheck(new cmd.ReqSubcribeHallSlot());
                MiniGameNetworkClient.getInstance().sendCheck(new cmd.ReqGetMoneyUse());
            }

            Configs.App.getServerConfig();

            MiniGameNetworkClient.getInstance().addOnClose(() => {
                console.log("on close minigame");
            }, this);

            MiniGameNetworkClient.getInstance().addListener((data) => {
                let inPacket = new InPacket(data);
                // console.log(inPacket.getCmdId());
                switch (inPacket.getCmdId()) {
                    case cmd.Code.NOTIFY_MARQUEE: {
                        let res = new cmd.ResNotifyMarquee(data);
                        let resJson = JSON.parse(res.message);
                        LobbyController.notifyMarquee = "";
                        for (let i = 0; i < resJson["entries"].length; i++) {
                            let e = resJson["entries"][i];
                            LobbyController.notifyMarquee += "<color=#90ff00>(" + Configs.GameId.getGameName(e["g"]) + ")</color>";
                            LobbyController.notifyMarquee += "<color=#ff0054> " + e["n"] + "</color> thắng ";
                            LobbyController.notifyMarquee += "<color=#ffeb30>" + Utils.formatNumber(e["m"]) + "</color>";
                            if (i < resJson["entries"].length - 1) {
                                LobbyController.notifyMarquee += "        ";
                            }
                        }
                        break;
                    }
                    case cmd.Code.UPDATE_JACKPOTS: {
                        let res = new cmd.ResUpdateJackpots(data);
                        this.buttonListJackpot.setData(res);
                        break;
                    }
                    case cmd.Code.GET_MONEY_USE: {
                        let res = new cmd.ResGetMoneyUse(data);
                        // console.log(res);
                        Configs.Login.Coin = res.moneyUse;
                        BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                        break;
                    }
                }
            }, this);
            // MiniGameNetworkClient.getInstance().send(new cmd.ReqSubcribeJackpots());
            this.buttonListJackpot.updateJackpot(0.3);

            SlotNetworkClient.getInstance().addListener((data) => {
                let inPacket = new InPacket(data);
                switch (inPacket.getCmdId()) {
                    case cmd.Code.UPDATE_JACKPOT_SLOTS: {
                        //{"ndv":{"100":{"p":673620,"x2":0},"1000":{"p":6191000,"x2":0},"10000":{"p":73540000,"x2":0}},"kb":{"100":{"p":503160,"x2":0},"1000":{"p":5044400,"x2":0},"10000":{"p":51398000,"x2":0}},"vqv":{"100":{"p":509480,"x2":0},"1000":{"p":5013000,"x2":0},"10000":{"p":50852000,"x2":0}},"sah":{"100":{"p":502890,"x2":0},"1000":{"p":6932010,"x2":0},"10000":{"p":55193700,"x2":0}}}
                        let res = new cmd.ResUpdateJackpotSlots(data);
                        let resJson = JSON.parse(res.pots);


                        let spartan = resJson["spartan"];
                        this.tabsListGame.updateItemJackpots("spartans", spartan["100"]["p"], spartan["100"]["x2"] == 1, spartan["1000"]["p"], spartan["1000"]["x2"] == 1, spartan["10000"]["p"], spartan["10000"]["x2"] == 1);

                        //audition
                        let audition = resJson["audition"];
                        this.tabsListGame.updateItemJackpots("audition", audition["100"]["p"], audition["100"]["x2"] == 1, audition["1000"]["p"], audition["1000"]["x2"] == 1, audition["10000"]["p"], audition["10000"]["x2"] == 1);

                        //maybach
                        let maybach = resJson["maybach"];
                        this.tabsListGame.updateItemJackpots("captain", maybach["100"]["p"], maybach["100"]["x2"] == 1, maybach["1000"]["p"], maybach["1000"]["x2"] == 1, maybach["10000"]["p"], maybach["10000"]["x2"] == 1);

                        //tamhung
                        let tamhung = resJson["tamhung"];
                        this.tabsListGame.updateItemJackpots("tamhung", tamhung["100"]["p"], tamhung["100"]["x2"] == 1, tamhung["1000"]["p"], tamhung["1000"]["x2"] == 1, tamhung["10000"]["p"], tamhung["10000"]["x2"] == 1);

                        //range rover
                        let rangeRover = resJson["rangeRover"];
                        this.tabsListGame.updateItemJackpots("aztec", rangeRover["100"]["p"], rangeRover["100"]["x2"] == 1, rangeRover["1000"]["p"], rangeRover["1000"]["x2"] == 1, rangeRover["10000"]["p"], rangeRover["10000"]["x2"] == 1);

                        //range rover
                        let benley = resJson["benley"];
                        this.tabsListGame.updateItemJackpots("zeus", benley["100"]["p"], benley["100"]["x2"] == 1, benley["1000"]["p"],
                            benley["1000"]["x2"] == 1, benley["10000"]["p"], benley["10000"]["x2"] == 1);

                        //range rover
                        let rollroye = resJson["rollRoye"];
                        this.tabsListGame.updateItemJackpots("gainhay", rollroye["100"]["p"], rollroye["100"]["x2"] == 1, rollroye["1000"]["p"],
                            rollroye["1000"]["x2"] == 1, rollroye["10000"]["p"], rollroye["10000"]["x2"] == 1);
                        this.createListdata(j100, j1000, j10000);
                        for (var i = 0; i < this.listData100.length; i++) {
                            // // 100
                            if (this.listData100[i].gameid == "spartans") {
                                this.listData100[i] = new Tophudata("spartans", "Spartans", spartan["100"]["p"]);
                            }
                            if (this.listData100[i].gameid == "audition") {
                                this.listData100[i] = new Tophudata("audition", "Audition", audition["100"]["p"]);
                            }
                            if (this.listData100[i].gameid == "captain") {
                                this.listData100[i] = new Tophudata("captain", "Captain", maybach["100"]["p"]);
                            }
                            if (this.listData100[i].gameid == "tamhung") {
                                this.listData100[i] = new Tophudata("tamhung", "Tam Hùng", tamhung["100"]["p"]);
                            }
                            if (this.listData100[i].gameid == "aztec") {
                                this.listData100[i] = new Tophudata("aztec", "Aztec", rangeRover["100"]["p"]);
                            }
                            if (this.listData100[i].gameid == "zeus") {
                                this.listData100[i] = new Tophudata("zeus", "Zeus", benley["100"]["p"]);
                            }
                            if (this.listData100[i].gameid == "gainhay") {
                                this.listData100[i] = new Tophudata("gainhay", "Gái Nhảy", rollroye["100"]["p"]);
                            }
                            // // 1000
                            if (this.listData1000[i].gameid == "spartans") {
                                this.listData1000[i] = new Tophudata("spartans", "Spartans", spartan["1000"]["p"]);
                            }
                            if (this.listData1000[i].gameid == "audition") {
                                this.listData1000[i] = new Tophudata("audition", "Audition", audition["1000"]["p"]);
                            }
                            if (this.listData1000[i].gameid == "captain") {
                                this.listData1000[i] = new Tophudata("captain", "Captain", maybach["1000"]["p"]);
                            }
                            if (this.listData1000[i].gameid == "tamhung") {
                                this.listData1000[i] = new Tophudata("tamhung", "Tam Hùng", tamhung["1000"]["p"]);
                            }
                            if (this.listData1000[i].gameid == "aztec") {
                                this.listData1000[i] = new Tophudata("aztec", "Aztec", rangeRover["1000"]["p"]);
                            }
                            if (this.listData1000[i].gameid == "zeus") {
                                this.listData1000[i] = new Tophudata("zeus", "Zeus", benley["1000"]["p"]);
                            }
                            if (this.listData1000[i].gameid == "gainhay") {
                                this.listData1000[i] = new Tophudata("gainhay", "Gái Nhảy", rollroye["1000"]["p"]);
                            }
                            // // 10000
                            if (this.listData10000[i].gameid == "spartans") {
                                this.listData10000[i] = new Tophudata("spartans", "Spartans", spartan["10000"]["p"]);
                            }
                            if (this.listData10000[i].gameid == "audition") {
                                this.listData10000[i] = new Tophudata("audition", "Audition", audition["10000"]["p"]);
                            }
                            if (this.listData10000[i].gameid == "captain") {
                                this.listData10000[i] = new Tophudata("captain", "Captain", maybach["10000"]["p"]);
                            }
                            if (this.listData10000[i].gameid == "tamhung") {
                                this.listData10000[i] = new Tophudata("tamhung", "Tam Hùng", tamhung["10000"]["p"]);
                            }
                            if (this.listData10000[i].gameid == "aztec") {
                                this.listData10000[i] = new Tophudata("aztec", "Aztec", rangeRover["10000"]["p"]);
                            }
                            if (this.listData10000[i].gameid == "zeus") {
                                this.listData10000[i] = new Tophudata("zeus", "Zeus", benley["10000"]["p"]);
                            }
                            if (this.listData10000[i].gameid == "gainhay") {
                                this.listData10000[i] = new Tophudata("gainhay", "Gái Nhảy", rollroye["10000"]["p"]);
                            }
                        }
                        this.topHu.ShowData(this.listData100, this.listData1000, this.listData10000);
                        break;
                    }
                }
            }, this);

            ShootFishNetworkClient.getInstance().addListener((route, data) => {
                switch (route) {
                    case "OnUpdateJackpot":
                        this.tabsListGame.updateItemJackpots("shootfish", data["14"], false, data["24"], false, data["34"], false);
                        break;
                }
            }, this);

            AudioManager.getInstance().playBackgroundMusic(this.clipBgm);
        }

        onDestroy() {
            SlotNetworkClient.getInstance().send(new cmd.ReqUnSubcribeHallSlot());
        }
        createListdata(j100: number, j1000: number, j10000: number) {
            this.listData100 = new Array<Tophudata>();
            this.listData1000 = new Array<Tophudata>();
            this.listData10000 = new Array<Tophudata>();
            this.listData100.push(
                new Tophudata("spartans", "Spartans", j100),
                new Tophudata("audition", "Audition", j100),
                new Tophudata("captain", "Captain", j100),
                new Tophudata("tamhung", "Tam Hùng", j100),
                new Tophudata("aztec", "Aztec", j100),
                new Tophudata("zeus", "Zeus", j100),
                new Tophudata("gainhay", "Gái Nhảy", j100),
                new Tophudata("shootfish", "Bắn Cá", j100));
            this.listData1000.push(
                new Tophudata("spartans", "Spartans", j1000),
                new Tophudata("audition", "Audition", j1000),
                new Tophudata("captain", "Captain", j1000),
                new Tophudata("tamhung", "Tam Hùng", j1000),
                new Tophudata("aztec", "Aztec", j1000),
                new Tophudata("zeus", "Zeus", j1000),
                new Tophudata("gainhay", "Gái Nhảy", j1000),
                new Tophudata("shootfish", "Bắn Cá", j1000));
            this.listData10000.push(
                new Tophudata("spartans", "Spartans", j10000),
                new Tophudata("audition", "Audition", j10000),
                new Tophudata("captain", "Captain", j10000),
                new Tophudata("tamhung", "Tam Hùng", j10000),
                new Tophudata("aztec", "Aztec", j10000),
                new Tophudata("zeus", "Zeus", j10000),
                new Tophudata("gainhay", "Gái Nhảy", j10000),
                new Tophudata("shootfish", "Bắn Cá", j10000));
        }

        actLogin(): void {
            // console.log("actLogin");
            let username = this.edbUsername.string.trim();
            let password = this.edbPassword.string;

            if (username.length == 0) {
                App.instance.alertDialog.showMsg("Tên đăng nhập không được để trống.");
                return;
            }

            if (password.length == 0) {
                App.instance.alertDialog.showMsg("Mật khẩu không được để trống.");
                return;
            }

            App.instance.showLoading(true);
            Http.get(Configs.App.API, { c: 3, un: username, pw: md5(password) }, (err, res) => {
                App.instance.showLoading(false);
                if (err != null) {
                    App.instance.alertDialog.showMsg("Đăng nhập không thành công, vui lòng kiểm tra lại kết nối.");
                    return;
                }
                // console.log(res);
                switch (parseInt(res["errorCode"])) {
                    case 0:
                        // console.log("Đăng nhập thành công.");
                        Configs.Login.AccessToken = res["accessToken"];
                        Configs.Login.SessionKey = res["sessionKey"];
                        Configs.Login.Username = username;
                        Configs.Login.Password = password;
                        Configs.Login.IsLogin = true;
                        var userInfo = JSON.parse(base64.decode(Configs.Login.SessionKey));
                        Configs.Login.Nickname = userInfo["nickname"];
                        Configs.Login.Avatar = userInfo["avatar"];
                        Configs.Login.Coin = userInfo["vinTotal"];
                        Configs.Login.LuckyWheel = userInfo["luckyRotate"];
                        Configs.Login.IpAddress = userInfo["ipAddress"];
                        Configs.Login.CreateTime = userInfo["createTime"];
                        Configs.Login.Birthday = userInfo["birthday"];
                        Configs.Login.Birthday = userInfo["birthday"];
                        Configs.Login.VipPoint = userInfo["vippoint"];
                        Configs.Login.VipPointSave = userInfo["vippointSave"];

                        // MiniGameNetworkClient.getInstance().checkConnect();
                        MiniGameNetworkClient.getInstance().sendCheck(new cmd.ReqSubcribeJackpots());
                        SlotNetworkClient.getInstance().sendCheck(new cmd.ReqSubcribeHallSlot());
                        ShootFishNetworkClient.getInstance().checkConnect(() => {
                            BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                        });

                        this.panelNotLogin.active = false;
                        this.panelLogined.active = true;

                        SPUtils.setUserName(Configs.Login.Username);
                        SPUtils.setUserPass(Configs.Login.Password);

                        App.instance.buttonMiniGame.show();

                        BroadcastReceiver.send(BroadcastReceiver.USER_INFO_UPDATED);

                        /* switch (VersionConfig.CPName) {
                            default:
                                this.popupBoomTan.show();
                                break;
                        } */
                        break;
                    case 1007:
                        App.instance.alertDialog.showMsg("Thông tin đăng nhập không hợp lệ.");
                        break;
                    case 2001:
                        this.popupUpdateNickname.show2(username, password);
                        break;
                    default:
                        App.instance.alertDialog.showMsg("Đăng nhập không thành công vui lòng thử lại sau.");
                        break;
                }
            });
        }

        actMenu() {
            this.panelMenu.toggle();
        }

        actDaiLy() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            this.popupDaily.show();
        }
        actnaprut() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            this.Popupnaprut.show();
        }
        actGiftCode() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            this.popupGiftCode.show();
        }

        actVQMM() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            this.popupLuckyWheel.show();
        }

        actEvent() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            this.popupEventLogin.show();
           // cc.sys.openURL(Configs.App.LINK_EVENT);
        }

        actDownload() {
            cc.sys.openURL(Configs.App.LINK_DOWNLOAD);
        }

        actFanpage() {
            cc.sys.openURL(Configs.App.getLinkFanpage());
        }
        actGroup() {
            cc.sys.openURL(Configs.App.LINK_GROUP);
        }

        actTelegram() {
            App.instance.openTelegram(Configs.App.getLinkTelegramGroup());
        }

        actAppOTP() {
            App.instance.openTelegram();
        }



        actSupportOnline() {
            // cc.sys.openURL(Configs.App.LINK_SUPPORT);
            if (!cc.sys.isNative) {
                var url = "https://direct.lc.chat/12475137/";
                cc.sys.openURL(url);
                //Tawk_API.toggle();
            }
            else {
                App.instance.openTelegram();
            }
            //App.instance.openTelegram();
        }

        actSupport() {
            this.panelSupport.active = !this.panelSupport.active;
            // if (this.panelSupport.active) {
            //     this.panelSupport.stopAllActions();
            //     this.panelSupport.scale = 1;
            //     this.panelSupport.runAction(cc.sequence(
            //         cc.scaleTo(0.2, 0).easing(cc.easeBackIn()),
            //         cc.callFunc(() => {
            //             this.panelSupport.active = false;
            //         })
            //     ));
            // } else {
            //     this.panelSupport.stopAllActions();
            //     this.panelSupport.active = true;
            //     this.panelSupport.scale = 0;
            //     this.panelSupport.runAction(cc.sequence(
            //         cc.scaleTo(0.2, 1).easing(cc.easeBackOut()),
            //         cc.callFunc(() => {
            //         })
            //     ));
            // }
            return;
            cc.sys.openURL(Configs.App.LINK_SUPPORT);
        }

        actBack() {
            App.instance.confirmDialog.show3("Bạn có muốn đăng xuất khỏi tài khoản?", "ĐĂNG XUẤT", (isConfirm) => {
                if (isConfirm) {
                    BroadcastReceiver.send(BroadcastReceiver.USER_LOGOUT);
                }
            });
        }

        public actSwitchCoin() {
            if (this.lblCoin.node.parent.active) {
                this.lblCoin.node.parent.active = false;
                this.lblCoinFish.node.parent.active = true;
            } else {
                this.lblCoin.node.parent.active = true;
                this.lblCoinFish.node.parent.active = false;
            }
        }

        actGameTaiXiu() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.openGameTaiXiuMini();
        }

        actGameBauCua() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.openGameBauCua();
        }

        actGameCaoThap() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.openGameCaoThap();
        }

        actGameSlot3x3() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.openGameSlot3x3();
        }

        actGameMiniPoker() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.openGameMiniPoker();
        }

        actGameTaLa() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.alertDialog.showMsg("Sắp ra mắt.");
        }

        actGoToSlot1() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.showErrLoading("Đang kết nối tới server...");
            SlotNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadSceneInSubpackage("Slot1", "Slot1");
            });
        }

        actGoToSlot2() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.showErrLoading("Đang kết nối tới server...");
            SlotNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadSceneInSubpackage("Slot2", "Slot2");
            });
        }

        actGoToSlot3() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.showErrLoading("Đang kết nối tới server...");
            SlotNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadSceneInSubpackage("Slot3", "Slot3");
            });
        }

        actGoToSlot4() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.showErrLoading("Đang kết nối tới server...");
            SlotNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadSceneInSubpackage("Slot4", "Slot4");
            });
        }

        actGoToSlot5() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.showErrLoading("Đang kết nối tới server...");
            SlotNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadSceneInSubpackage("Slot5", "Slot5");
            });
        }


        actGoToSlot6() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.showErrLoading("Đang kết nối tới server...");
            SlotNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadSceneInSubpackage("Slot6", "Slot6");
            });
        }

        actGoToSlot7() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.showErrLoading("Đang kết nối tới server...");
            SlotNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadSceneInSubpackage("Slot7", "Slot7");
            });
        }

        actGoToSlot8() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.showErrLoading("Đang kết nối tới server...");
            SlotNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadSceneInSubpackage("Slot8", "Slot8");
            });
        }

        actDev() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.alertDialog.showMsg("Sắp ra mắt.");
            return;
        }

        actGoToShootFish() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.loadSceneInSubpackage("ShootFish", "ShootFish");
        }

        actGotoLoto() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.loadSceneInSubpackage("Loto", "Loto");
        }

        actGoToXocDia() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            // App.instance.alertDialog.showMsg("Sắp ra mắt.");
            // return;
            App.instance.loadSceneInSubpackage("XocDia", "XocDia");
        }

        actAddCoin() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.popupShop.show();
        }
        actCashout() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.popupCashout.show();
        }

        accExchange() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.popupShop.showAndOpenTransfer();
        }

        actGoToTLMN() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            // App.instance.alertDialog.showMsg("Sắp ra mắt.");
            // return;

            App.instance.showErrLoading("Đang kết nối tới server...");
            TienLenNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadScene("TienLen");
                // App.instance.loadSceneInSubpackage("TienLen", "TienLen");
            });
        }

        actGameTLMNSolo() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            // App.instance.alertDialog.showMsg("Sắp ra mắt.");
            // return;

            App.instance.showErrLoading("Đang kết nối tới server...");
            TienLenNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadScene("TienLen");
                // App.instance.loadSceneInSubpackage("TienLen", "TienLen");
            });
        }

        actGoToSam() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            // App.instance.alertDialog.showMsg("Sắp ra mắt.");
            // return;

            App.instance.showErrLoading("Đang kết nối tới server...");
            SamNetworkClient.getInstance().checkConnect(() => {
                App.instance.showLoading(false);
                App.instance.loadScene("Sam");
            });
        }

        actGoToBaCay() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            App.instance.loadSceneInSubpackage("BaCay", "BaCay");
        }

        actGoToBaiCao() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            // App.instance.alertDialog.showMsg("Sắp ra mắt.");
            // return;
            App.instance.loadSceneInSubpackage("BaiCao", "BaiCao");
        }

        actGoToPoker() {
            if (!Configs.Login.IsLogin) {
                App.instance.alertDialog.showMsg("Bạn chưa đăng nhập.");
                return;
            }
            //App.instance.alertDialog.showMsg("Sắp ra mắt.");
            //return;
            App.instance.loadSceneInSubpackage("Poker", "Poker");
        }
        // update (dt) {}
    }
}
export default Lobby.LobbyController;