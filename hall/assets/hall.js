cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function() {
        this.label = cc.find('Canvas/label').getComponent(cc.Label);
    },

    start() {
        this._initAssetManage();
    },

    _initAssetManage() {
        if (cc.sys.isBrowser) {
            return;
        }

        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'ALLGame/subgame');

        let versionCompareHandle = function (versionA, versionB) {
            let vA = versionA.split('.');
            let vB = versionB.split('.');
            for (let i = 0; i < vA.length; ++i) {
                let a = parseInt(vA[i]);
                let b = parseInt(vB[i] || 0);
                if (a !== b) {
                    return a - b;
                }
            }
            return vB.length > vA.length ? -1 : 0;
        };

        this._am = new jsb.AssetsManager('', this._storagePath, versionCompareHandle);

        this._am.setVerifyCallback((filePath, asset) => {           //获取下载下来的文件的MD5跟manifest文件的md5进行比较，是否文件有问题
            // if (filePath.endsWith('project.manifest')) return true;
            // let data = jsb.fileUtils.getDataFromFile(filePath);
            // let fileMD5 = MD5(data);
            // let assetsMD5 = asset.md5;
            // return (fileMD5 === assetsMD5 || assetsMD5 === '111111');
        });

        if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            this._am.setMaxConcurrentTask(2);
        }
    },

    _chechUpdate() {

        if (cc.sys.isBrowser) return;

        let UIRLFILE = "http://192.168.92.59/update/remote-assets";
        let remoteManifestUrl = this._storagePath + "/project.manifest";
        this.manifestUrl = remoteManifestUrl;

        let customManifestStr = JSON.stringify({
            "packageUrl": UIRLFILE,
            "remoteManifestUrl": UIRLFILE + "/project.manifest",
            "remoteVersionUrl": UIRLFILE + "/version.manifest",
            "version": "1.0.0.0",
            "assets": {},
            "searchPaths": []
        });

        this._checkListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        cc.eventManager.addListener(this._checkListener, 1);

        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            if (jsb.fileUtils.isFileExist(remoteManifestUrl)) {
                console.log('加载本地Manifest');
                this._am.loadLocalManifest(this.manifestUrl);
            } else {
                console.log('加载网络Manifest');
                let manifest = new jsb.Manifest(customManifestStr, this._storagePath);
                this._am.loadLocalManifest(manifest, this._storagePath);
            }
        }

        console.log("检查文件更新:" + remoteManifestUrl);
        this._am.checkUpdate();
    },

    _hotUpdate() {
        if (this._am) {
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            cc.eventManager.addListener(this._updateListener, 1);

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                this._am.loadLocalManifest(this.manifestUrl);
            }
            this._am.update();
        }
    },

    //*************************子游戏demo 开始***************************//
    getfiles: function(name, mmm) {
        if (cc.sys.isBrowser){
            return;
        }

        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'ALLGame/' + name);

        let UIRLFILE = "http://192.168.92.59/update/remote-assets";
        let remoteManifestUrl = this._storagePath + "/project.manifest";
        this.manifestUrl = remoteManifestUrl;

        let customManifestStr = JSON.stringify({
            "packageUrl": UIRLFILE,
            "remoteManifestUrl": UIRLFILE + "/project.manifest",
            "remoteVersionUrl": UIRLFILE + "/version.manifest",
            "version": "0.0.1",
            "assets": {},
            "searchPaths": []
        });

        let versionCompareHandle = function(versionA, versionB) {
            let vA = versionA.split('.');
            let vB = versionB.split('.');
            for (let i = 0; i < vA.length; ++i) {
                let a = parseInt(vA[i]);
                let b = parseInt(vB[i] || 0);
                if (a === b) {
                    continue;
                } else {
                    return a - b;
                }
            }
            if (vB.length > vA.length) {
                return -1;
            } else {
                return 0;
            }
        };

        this._am = new jsb.AssetsManager('', this._storagePath, versionCompareHandle);

        if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            this._am.setMaxConcurrentTask(2);
        }

        if (mmm === 1) {
            console.log('开始更新版本');
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
        } else {
            console.log('开始检查版本');
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.checkCb.bind(this));
        }

        cc.eventManager.addListener(this._updateListener, 1);

        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            if (jsb.fileUtils.isFileExist(remoteManifestUrl)) {
                this._am.loadLocalManifest(this.manifestUrl);
            } else {
                let manifest = new jsb.Manifest(customManifestStr, this._storagePath);
                this._am.loadLocalManifest(manifest, this._storagePath);
            }
        }

        if (mmm === 1) {
            this._shengji = true;
            this._am.update();
        } else {
            this._am.checkUpdate();
            this._shengji = false;
        }
        console.log("更新文件:" + remoteManifestUrl);
    },

    updateCb: function(event) {
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                /*0 本地没有配置文件*/
                break;

            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
                /*1下载配置文件错误*/
                break;
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                /*2 解析文件错误*/
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                /*3发现新的更新*/
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                /*4 已经是最新的*/
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                /*5 最新进展  做 进度的*/
                this.label.string = event.getPercentByFile();
                break;
            case jsb.EventAssetsManager.ASSET_UPDATED:
                /*6需要更新*/
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                /*7更新错误*/
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                /*8更新完成*/
                this.label.string = "更新完成";
                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                /*9更新失败*/
                this.label.string = '更新失败: ' + event.getMessage();
                // this.getfiles("subgame", 1);
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                /*10解压失败*/
                break;
        }
    },

    checkCb: function(event) {
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                this.label.string = '找到新版本';
                cc.eventManager.removeListener(this._checkListener);
                this._checkListener = null;
                setTimeout(() => this._hotUpdate(), 2000);
                return;
            default:
                return;
        }
    },

    download_sub_game: function() {
        this._chechUpdate();
    },

    enter_sub_game: function() {
        // if (!this._storagePath) {
        //     cc.find("Canvas/label").getComponent(cc.Label).string = "请先点击下载游戏，检查版本是否更新！！！";
        //     return;
        // }
        console.log('subgame path = '+ this._storagePath);
        
        // require(this._storagePath + "/src/main.js");
    },
    //*************************子游戏demo 结束***************************//
});