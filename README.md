hall是大厅的代码，只包含了一个大厅场景，HotUpdate.js文件是下载子游戏的代码。
 
 
 
ChildGame是子游戏。也只有一个场景，里面有一个按钮用来返回大厅的。在子游戏的目录下有一个childgame目录，里面的文件是用来放到服务器上面供大厅下载的。


main.js跟dating.js文件就是加载子游戏跟返回大厅的关键。在build后要把这两个文件放到jsb-default目录下的src文件夹下面，然后生成热更新资源。这样的话dating.js跟main.js才会在project.manifest的热更新配置资源里面  
