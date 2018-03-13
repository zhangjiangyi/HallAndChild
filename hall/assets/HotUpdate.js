cc.Class({
    extends: cc.Component,

    properties: {
        _am: null,
        _updating: false,
        _canRetry: true,
        _storagePath: '',
        _version: -1,
    },
    // use this for initialization
    onLoad: function () {
        this.initView();
        this.initAssetsManage();
    },

    initView() {
        this.percentLabel = cc.find('Canvas/percent').getComponent(cc.Label);
        this.prmopt = cc.find('Canvas/prompt').getComponent(cc.Label);
    },

    initAssetsManage() {
        if (cc.sys.isBrowser) {
            return;
        }
        this._storagePath = ((jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + 'ALLGame/subgame');
        
        console.log('SubGame path ' + this._storagePath);
        
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

        if (!cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.retain();
        }

        if (cc.sys.os === cc.sys.OS_ANDROID) {
            this._am.setMaxConcurrentTask(2);
        }
    },

    checkCb: function (event) {
        let delayTime = 2000;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.prmopt.string = "本地Manifest文件未找到";
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.prmopt.string = "加载Manifest文件失败";
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.prmopt.string = "已经是最新版本";
                delayTime = 1000;
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                this.prmopt.string = '找到新版本';
                cc.eventManager.removeListener(this._checkListener);
                this._checkListener = null;
                this._updating = false;
                setTimeout(() =>  this.hotUpdate(), 1000);
                return;
            default:
                return;
        }

        cc.eventManager.removeListener(this._checkListener);
        this._checkListener = null;
        this._updating = false;
    },

    updateCb: function (event) {
        console.log('update eventCode = ' + event.getEventCode(), 'update msg = ' + event.getMessage());
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                this.prmopt.string = '未找到本地Manifest文件';
                break;
            case jsb.EventAssetsManager.UPDATE_PROGRESSION:
                let percent = event.getPercent().toFixed(2);
                this.percentLabel.string = parseInt(percent * 100) + '%';
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                this.prmopt.string = '下载Manifest文件失败';
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                this.prmopt.string = '已更新到最新版本';
                break;
            case jsb.EventAssetsManager.UPDATE_FINISHED:
                this.prmopt.string = '更新成功，正在重启游戏...';

                cc.eventManager.removeListener(this._updateListener);
                this._updateListener = null;
                this._updating = false;

                break;
            case jsb.EventAssetsManager.UPDATE_FAILED:
                this._updating = false;
                this.prmopt.string = '更新失败';
                break;
            case jsb.EventAssetsManager.ERROR_UPDATING:
                this.prmopt.string = '更新文件错误 ' + event.getAssetId() + ', ' + event.getMessage();
                break;
            case jsb.EventAssetsManager.ERROR_DECOMPRESS:
                this.prmopt.string = event.getMessage();
                break;
            default:
                break;
        }
    },

    retry: function () {
        if (!this._updating && this._canRetry) {
            this._canRetry = false;

            this.prmopt.string = '更新失败，再次更新';
            this._am.downloadFailedAssets();
        }
    },

    checkUpdate: function () {
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
        this.prmopt.string = '正在检查版本信息';
        this._am.checkUpdate();
        this._updating = true;
    },

    hotUpdate: function () {

        if (this._am) {
            this._updateListener = new jsb.EventListenerAssetsManager(this._am, this.updateCb.bind(this));
            cc.eventManager.addListener(this._updateListener, 1);

            if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
                console.log('load local manifest');
                this._am.loadLocalManifest(this.manifestUrl);
            }
            console.log('update');
            this._am.update();
        }
    },

    getVersion: function () {   //获取版本信息
        if (cc.sys.isBrowser) {
            return;
        }
        if (this._am.getState() === jsb.AssetsManager.State.UNINITED) {
            this._am.loadLocalManifest(this.manifestUrl);
        }
        return this._am.getLocalManifest().getVersion();
    },


    enter_sub_game: function() {
        if (!this._storagePath) {
            this.prompt.string = "请先点击下载游戏，检查版本是否更新！！！";
            return;
        }

        console.log('subgame path = '+ this._storagePath);
        require(this._storagePath + "/src/main.js");
    },

    onDestroy: function () {
        if (this._updateListener) {
            cc.eventManager.removeListener(this._updateListener);
            this._updateListener = null;
        }
        if (this._am && !cc.sys.ENABLE_GC_FOR_NATIVE_OBJECTS) {
            this._am.release();
        }
    }
});
