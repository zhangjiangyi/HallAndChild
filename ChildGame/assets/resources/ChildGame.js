cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        cc.find('Canvas/label').getComponent(cc.Label).string = '子游戏  Hello World!!'
    },

    returnDating: function () {
        cc.INGAME = (jsb.fileUtils ? jsb.fileUtils.getWritablePath() : '/') + "ALLGame/subgame";
        require(cc.INGAME+"/src/dating.js");
    }

});
