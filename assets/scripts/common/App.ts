import { String } from './../../../creator.d';
import AlertDialog from "../common/AlertDialog";
import ConfirmDialog from "../common/ConfirmDialog";
import SubpackageDownloader from "./SubpackageDownloader";
import BroadcastReceiver from "./BroadcastReceiver";
import MiniGameNetworkClient from "../networks/MiniGameNetworkClient";
import Configs from "./Configs";
import MiniGame from "../../Lobby/src/MiniGame";
import ButtonMiniGame from "../../Lobby/src/ButtonMiniGame";
import PopupShop from "../../Lobby/src/Lobby.PopupShop";
import PopupCashout from "../../Lobby/src/Lobby.PopupCashout";
import PopupCardInfo from "../../Lobby/src/Lobby.PopupCardInfo";

const { ccclass, property } = cc._decorator;

@ccclass
export default class App extends cc.Component {

    static instance: App = null;

    @property
    designResolution: cc.Size = new cc.Size(1280, 720);

    @property(cc.Node)
    loading: cc.Node = null;
    @property(cc.Node)
    loadingIcon: cc.Node = null;
    @property(cc.Label)
    loadingLabel: cc.Label = null;

    @property(AlertDialog)
    alertDialog: AlertDialog = null;

    @property(ConfirmDialog)
    confirmDialog: ConfirmDialog = null;

    @property([cc.SpriteFrame])
    sprFrameAvatars: Array<cc.SpriteFrame> = new Array<cc.SpriteFrame>();

    @property(cc.Node)
    buttonMiniGameNode: cc.Node = null;

    @property(cc.Node)
    miniGame: cc.Node = null;

    @property(PopupShop)
    popupShop: PopupShop = null;

    @property(PopupCashout)
    popupCashout: PopupCashout = null;

    @property(PopupCardInfo)
    popupCardInfo: PopupCardInfo = null;

    public buttonMiniGame: ButtonMiniGame;

    private lastWitdh: number = 0;
    private lastHeight: number = 0;

    private timeOutLoading: any = null;
    private isFisrtNetworkConnected = false;

    private subpackageLoaded: Object = {};

    private taiXiuDouble: MiniGame = null;
    private miniPoker: MiniGame = null;
    private caoThap: MiniGame = null;
    private bauCua: MiniGame = null;
    private slot3x3: MiniGame = null;
    private oanTuTi: MiniGame = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        console.log("App onLoad");
        if (App.instance != null) {
            this.node.destroy();
            return;
        }
        App.instance = this;
        cc.game.addPersistRootNode(App.instance.node);
        // cc.debug.setDisplayStats(true);

        this.buttonMiniGame = this.buttonMiniGameNode.getComponent(ButtonMiniGame);

        BroadcastReceiver.register(BroadcastReceiver.USER_LOGOUT, () => {

        }, this);
    }

    start() {
        this.updateSize();
    }

    showLoading(isShow: boolean, timeOut: number = 15) {
        this.loadingLabel.string = "Đang tải...";
        if (this.timeOutLoading != null) clearTimeout(this.timeOutLoading);
        if (isShow) {
            if (timeOut > 0) {
                this.timeOutLoading = setTimeout(() => {
                    this.showLoading(false);
                }, timeOut * 1000);
            }
            this.loading.active = true;
        } else {
            this.loading.active = false;
        }
        this.loadingIcon.stopAllActions();
        this.loadingIcon.runAction(cc.repeatForever(cc.rotateBy(1, 360)));
    }

    showErrLoading(msg?: string) {
        this.showLoading(true, -1);
        this.loadingLabel.string = msg ? msg : "Mất kết nối, đang thử lại...";
    }

    update(dt: number) {
        this.updateSize();
    }

    updateSize() {
        var frameSize = cc.view.getFrameSize();
        if (this.lastWitdh !== frameSize.width || this.lastHeight !== frameSize.height) {

            this.lastWitdh = frameSize.width;
            this.lastHeight = frameSize.height;

            var newDesignSize = cc.Size.ZERO;
            if (this.designResolution.width / this.designResolution.height > frameSize.width / frameSize.height) {
                newDesignSize = cc.size(this.designResolution.width, this.designResolution.width * (frameSize.height / frameSize.width));
            } else {
                newDesignSize = cc.size(this.designResolution.height * (frameSize.width / frameSize.height), this.designResolution.height);
            }
            // cc.log("update node size: " + newDesignSize);
            this.node.setContentSize(newDesignSize);
            this.node.setPosition(cc.v2(newDesignSize.width / 2, newDesignSize.height / 2));
        }
    }

    getAvatarSpriteFrame(avatar: string): cc.SpriteFrame {
        let avatarInt = parseInt(avatar);
        if (isNaN(avatarInt) || avatarInt < 0 || avatarInt >= this.sprFrameAvatars.length) {
            return this.sprFrameAvatars[0];
        }
        return this.sprFrameAvatars[avatarInt];
    }

    loadScene(sceneName: string) {
        cc.director.preloadScene(sceneName, (c, t, item) => {
            this.showErrLoading("Đang tải..." + parseInt("" + ((c / t) * 100)) + "%");
        }, (err, sceneAsset) => {
            this.showLoading(false);
            cc.director.loadScene(sceneName);
        });
    }

    loadSceneInSubpackage(subpackageName: string, sceneName: string) {
        if (!this.subpackageLoaded.hasOwnProperty(subpackageName) || !this.subpackageLoaded[subpackageName]) {
            this.showLoading(true, -1);
            SubpackageDownloader.downloadSubpackage(subpackageName, (err, progress) => {
                if (err == "progress") {
                    this.showErrLoading("Đang tải..." + parseInt("" + (progress * 100)) + "%");
                    return;
                }
                this.showLoading(false);
                if (err) {
                    this.alertDialog.showMsg(err);
                    return;
                }
                this.showLoading(true, -1);
                this.subpackageLoaded[subpackageName] = true;
                cc.director.preloadScene(sceneName, (c, t, item) => {
                    this.showErrLoading("Đang tải..." + parseInt("" + ((c / t) * 100)) + "%");
                }, (err, sceneAsset) => {
                    this.showLoading(false);
                    cc.director.loadScene(sceneName);
                });
            });
        } else {
            cc.director.preloadScene(sceneName, (c, t, item) => {
                this.showErrLoading("Đang tải..." + parseInt("" + ((c / t) * 100)) + "%");
            }, (err, sceneAsset) => {
                this.showLoading(false);
                cc.director.loadScene(sceneName);
            });
        }
    }

    loadPrefabInSubpackage(subpackageName: string, prefabPath: string, onLoaded: (err: string, prefab: cc.Prefab) => void) {
        if (!this.subpackageLoaded.hasOwnProperty(subpackageName) || !this.subpackageLoaded[subpackageName]) {
            this.showLoading(true, -1);
            SubpackageDownloader.downloadSubpackage(subpackageName, (err, progress) => {
                if (err == "progress") {
                    this.showErrLoading("Đang tải..." + parseInt("" + (progress * 100)) + "%");
                    return;
                }
                this.showLoading(false);
                if (err) {
                    this.alertDialog.showMsg(err);
                    return;
                }
                this.subpackageLoaded[subpackageName] = true;
                cc.loader.loadRes(prefabPath, cc.Prefab, (c, t, item) => {
                    this.showErrLoading("Đang tải..." + parseInt("" + ((c / t) * 100)) + "%");
                }, (err, prefab) => {
                    this.showLoading(false);
                    onLoaded(err == null ? null : err.message, prefab);
                });
            });
        } else {
            this.showLoading(true, -1);
            cc.loader.loadRes(prefabPath, cc.Prefab, (c, t, item) => {
                this.showErrLoading("Đang tải..." + parseInt("" + ((c / t) * 100)) + "%");
            }, (err, prefab) => {
                this.showLoading(false);
                onLoaded(err == null ? null : err.message, prefab);
            });
        }
    }

    openGameBauCua() {
        App.instance.loadPrefabInSubpackage("BauCua", "prefabs/BauCua", (err, prefab) => {
            MiniGameNetworkClient.getInstance().checkConnect(() => {
                if (prefab != null) {
                    if (this.bauCua == null) {
                        let node = cc.instantiate(prefab);
                        node.parent = this.miniGame;
                        node.active = false;
                        this.bauCua = node.getComponent(MiniGame);
                    }
                    this.bauCua.show();
                } else {
                    console.log(err);
                }
            });
        });
    }

    openGameSlot3x3() {
        App.instance.loadPrefabInSubpackage("Slot3x3", "prefabs/Slot3x3", (err, prefab) => {
            MiniGameNetworkClient.getInstance().checkConnect(() => {
                if (prefab != null) {
                    if (this.slot3x3 == null) {
                        let node = cc.instantiate(prefab);
                        node.parent = this.miniGame;
                        node.active = false;
                        this.slot3x3 = node.getComponent(MiniGame);
                    }
                    this.slot3x3.show();
                } else {
                    console.log(err);
                }
            });
        });
    }

    openGameTaiXiuMini() {
        App.instance.loadPrefabInSubpackage("TaiXiuDouble", "prefabs/TaiXiuDouble", (err, prefab) => {
            MiniGameNetworkClient.getInstance().checkConnect(() => {
                if (prefab != null) {
                    if (this.taiXiuDouble == null) {
                        let node = cc.instantiate(prefab);
                        node.parent = this.miniGame;
                        node.active = false;
                        this.taiXiuDouble = node.getComponent(MiniGame);
                    }
                    this.taiXiuDouble.show();
                } else {
                    console.log(err);
                }
            });
        });
    }

    openGameMiniPoker() {
        App.instance.loadPrefabInSubpackage("MiniPoker", "prefabs/MiniPoker", (err, prefab) => {
            MiniGameNetworkClient.getInstance().checkConnect(() => {
                if (prefab != null) {
                    if (this.miniPoker == null) {
                        let node = cc.instantiate(prefab);
                        node.parent = this.miniGame;
                        node.active = false;
                        this.miniPoker = node.getComponent(MiniGame);
                    }
                    this.miniPoker.show();
                } else {
                    console.log(err);
                }
            });
        });
    }

    openGameCaoThap() {
        App.instance.loadPrefabInSubpackage("CaoThap", "prefabs/CaoThap", (err, prefab) => {
            MiniGameNetworkClient.getInstance().checkConnect(() => {
                if (prefab != null) {
                    if (this.caoThap == null) {
                        let node = cc.instantiate(prefab);
                        node.parent = this.miniGame;
                        node.active = false;
                        this.caoThap = node.getComponent(MiniGame);
                    }
                    this.caoThap.show();
                } else {
                    console.log(err);
                }
            });
        });
    }

    openGameOanTuTi() {
        // this.alertDialog.showMsg("Sắp ra măt.");
        // return;
        App.instance.loadPrefabInSubpackage("OanTuTi", "prefabs/OanTuTi", (err, prefab) => {
            MiniGameNetworkClient.getInstance().checkConnect(() => {
                if (prefab != null) {
                    if (this.oanTuTi == null) {
                        let node = cc.instantiate(prefab);
                        node.parent = this.miniGame;
                        node.active = false;
                        this.oanTuTi = node.getComponent(MiniGame);
                    }
                    this.oanTuTi.show();
                } else {
                    console.log(err);
                }
            });
        });
    }

    public openTelegram(name: string = null) {
        if(name == null){
            name = Configs.App.getLinkTelegram();
        }
        let url = "http://www.telegram.me/" + name;
        if (cc.sys.isNative) {
            url = "tg://resolve?domain=" + name;
        }
        cc.sys.openURL(url);
    }
    public ShowAlertDialog(mess: string)
    {
        this.alertDialog.showMsg(mess);
    }
}
