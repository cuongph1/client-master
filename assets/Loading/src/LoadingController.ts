import AlertDialog from "../../scripts/common/AlertDialog";
import Configs from "../../scripts/common/Configs";
import VersionConfig from "../../scripts/common/VersionConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoadingController extends cc.Component {

    @property(cc.Label)
    lblStatus: cc.Label = null;

    @property(cc.Node)
    loadings: cc.Node = null;

    @property(AlertDialog)
    alertDialog: AlertDialog = null;

    _storagePath: string = "";
    _am: any;
    _updating: boolean = false;
    _failCount = 0;
    private sprProgressBar: cc.Sprite = null;

    getCusomManifestStr() {
        let t = Date.now();
        return JSON.stringify({
            "packageUrl": Configs.App.HOT_UPDATE_URL,
            "remoteManifestUrl": Configs.App.HOT_UPDATE_URL + "project.manifest?t=" + t,
            "remoteVersionUrl": Configs.App.HOT_UPDATE_URL + "version.manifest?t=" + t,
            "version": "1.0.0"
        });
    }

    start() {
        
        
        for (let i = 0; i < this.loadings.childrenCount; i++) {
            this.loadings.children[i].active = this.loadings.children[i].name == VersionConfig.CPName;
           // console.log("VersionConfig.CPName " + VersionConfig.CPName);
           // console.log(this.loadings.children[i].name);
            if (this.loadings.children[i].name == VersionConfig.CPName) {
                
                this.sprProgressBar = this.loadings.children[i].getChildByName("progressBar").getComponent(cc.Sprite);
            }
        }
        //console.log("this is my test");
        //return;
        this.sprProgressBar.fillRange = 0;
        this.lblStatus.string = "";
        
        //this.alreadyUpToDate();
        
        if (CC_JSB && !CC_DEBUG) {
            this._storagePath = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'remote_assets';
            if (jsb.fileUtils.isFileExist(this._storagePath + "/project.manifest")) {
                // console.log("project.manifest existed");
                cc.loader.load(this._storagePath + "/project.manifest", (err, json) => {
                    json = JSON.parse(json);
                    // console.log("json old: " + JSON.stringify(json, null, "\t"));
                    var t = Date.now();
                    if (json.hasOwnProperty("remoteVersionUrl")) {
                        var rvu = json['remoteVersionUrl'].split("?t=");
                        json['remoteVersionUrl'] = rvu[0] + "?t=" + t;
                    }
                    if (json.hasOwnProperty("remoteManifestUrl")) {
                        var rmu = json['remoteManifestUrl'].split("?t=");
                        json['remoteManifestUrl'] = rmu[0] + "?t=" + t;
                    }
                    let saved = jsb.fileUtils.writeStringToFile(JSON.stringify(json, null, "\t"), this._storagePath + "/project.manifest");
                     console.log("json new saved: " + saved);
                     console.log("json new: " + JSON.stringify(json, null, "\t"));
                    this.initAssetManager();
                    this.checkUpdate();
                });
            } else {
                this.initAssetManager();
                this.checkUpdate();
            }
        } else {
            console.log("go directly to sence...");
            this.alreadyUpToDate();
        }
    }

    initAssetManager() {
        console.log('Storage path for remote asset : ' + this._storagePath);

        this.lblStatus.string = "Đang kiểm tra phiên bản mới...";
        this.sprProgressBar.fillRange = 0;

        var versionCompareHandle = (versionA: any, versionB: any) => {
            console.log("JS Custom Version Compare: version A is " + versionA + ', version B is ' + versionB);
            var vA = versionA.split('.');
            var vB = versionB.split('.');
            for (var i = 0; i < vA.length; ++i) {
                var a = parseInt(vA[i]);
                var b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                }
                else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            }
            else {
                return 0;
            }
        };

        this._am = new jsb.AssetsManager('', this._storagePath, versionCompareHandle);
    }

    checkUpdate() {
        if (this._updating) {
            return;
        }
        this._failCount = 0;

        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            var manifest = new jsb.Manifest(this.getCusomManifestStr(), this._storagePath);
            this._am.loadLocalManifest(manifest, this._storagePath);
        }

        this._am.setEventCallback(this.checkCb.bind(this));
        this._am.checkUpdate();
        console.log("Start check update local: " + this._am.getLocalManifest().getVersionFileUrl());
        console.log("Start check update remote: " + this._am.getRemoteManifest().getVersionFileUrl());
        this._updating = true;
    }

    checkCb(event) {
        var _this = this;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.log("No local manifest file found, hot update skipped.");
                this.lblStatus.string = "No local manifest file found, hot update skipped.";
                //this.alertDialog.showMsg("No local manifest file found, hot update skipped.");
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.log("Fail to download manifest file, hot update skipped.");
                this.lblStatus.string = "Fail to download manifest file, hot update skipped.";
                this.alreadyUpToDate();
                // this.alertDialog.show4("Fail to download manifest file, hot update skipped.", "Tiếp tục", () => {
                //     _this.alreadyUpToDate();
                // });
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log("Already up to date with the latest remote version.");
                this.lblStatus.string = "Already up to date with the latest remote version.";
                this.alreadyUpToDate();
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                console.log("New version found, please try to update.");
                this.lblStatus.string = "New version found, please try to update.";
                this.sprProgressBar.fillRange = 0;
                this.alertDialog.show4("Đã có phiên bản mới vui lòng cập nhật.", "Cập nhật", () => {
                    console.log("click cap nhat");
                    _this.startUpdate();
                });
                break;
            default:
                return;
        }
        this._am.setEventCallback(null);
        this._updating = false;
    }

    startUpdate() {
        if (this._am && !this._updating) {
            this._am.setEventCallback(this.updateCb.bind(this));

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                var manifest = new jsb.Manifest(this.getCusomManifestStr(), this._storagePath);
                this._am.loadLocalManifest(manifest, this._storagePath);
            }

            this._am.update();
            this._updating = true;
        }
    }

    updateCb(event) {
        var needRestart = false;
        var failed = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                console.log("No local manifest file found, hot update skipped.");
                this.lblStatus.string = "No local manifest file found, hot update skipped.";
                failed = true;
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                console.log("files: " + event.getDownloadedFiles() + ' / ' + event.getTotalFiles());
                console.log("bytes: " + event.getTotalBytes() + ' / ' + event.getDownloadedBytes());
                console.log("event.getPercent(): " + event.getPercent());
                this.sprProgressBar.fillRange = event.getDownloadedFiles() / event.getTotalFiles();
                this.lblStatus.string = "Đang tải dữ liệu..." + Math.round(event.getDownloadedFiles() / event.getTotalFiles() * 100) + "%";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                console.log("Fail to download manifest file, hot update skipped.");
                this.lblStatus.string = "Fail to download manifest file, hot update skipped.";
                failed = true;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                console.log("Already up to date with the latest remote version.");
                this.lblStatus.string = "Already up to date with the latest remote version.";
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                console.log("Update finished. " + event.getMessage());
                needRestart = true;
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                console.log('Update failed. ' + event.getMessage());
                if (this._failCount < 5) {
                    cc.sys.localStorage.setItem("HotUpdated", "false");
                    this._am.downloadFailedAssets();
                } else {
                    this._updating = false;
                    failed = true;
                }
                this._failCount++;
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                console.log('Asset update error: ' + event.getAssetId() + ', ' + event.getMessage());
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.alertDialog.showMsg('Decompress error: ' + event.getMessage());
                break;
            default:
                break;
        }

        if (failed) {
            this._am.setEventCallback(null);
            this._updating = false;
            this.alertDialog.show4("Tải xuống không thành công, vui lòng thử lại sau.", "Thử lại", () => {
                cc.game.restart();
            });
        }

        if (needRestart && !failed) {
            this._am.setEventCallback(null);
            // Prepend the manifest's search path
            var searchPaths: Array<string> = jsb.fileUtils.getSearchPaths();
            var newPaths = this._am.getLocalManifest().getSearchPaths();
            console.log("manifest paths: " + JSON.stringify(newPaths));
            for (var i = 0; i < newPaths.length; i++) {
                if (searchPaths.indexOf(newPaths[i]) == -1) {
                    searchPaths.push(newPaths[i]);
                }
            }
            // Array.prototype.unshift.apply(searchPaths, newPaths);
            console.log("new paths: " + JSON.stringify(newPaths));

            cc.sys.localStorage.setItem("HotUpdated", "true");
            cc.sys.localStorage.setItem('HotUpdateSearchPaths', JSON.stringify(searchPaths));
            jsb.fileUtils.setSearchPaths(searchPaths);

            cc.game.restart();
        }
    }

    alreadyUpToDate() {
        this.lblStatus.string = cc.sys.isNative ? "Đang chuẩn bị tài nguyên (Không tốn dữ liệu)...0%" : "Đang tải...0%";
        cc.director.preloadScene("Lobby", (c, t, i) => {
            this.lblStatus.string = (cc.sys.isNative ? "Đang chuẩn bị tài nguyên (Không tốn dữ liệu)..." : "Đang tải...") + (Math.round((c / t) * 100)) + "%";
            this.sprProgressBar.fillRange = c / t;
        }, () => {
            cc.director.loadScene("Lobby");
        });
    }
}