# 视频项目
需要自行安装nodejs环境
node官网：https://nodejs.org/en/
## 环境搭建
1、推荐使用`yarn`进行安装，没有安装过`yarn`的可以使用`npm`安装

```
npm i -g yarn
```

2、然后使用`yarn`安装依赖

```
安装项目的全部依赖（推荐）
yarn 或 yarn install

或者
yarn add [package] 安装指定依赖
yarn add [package]@[version] 安装指定版本依赖


```

3、为了规避跨域问题建议修改host

```
127.0.0.1 video.eqxiu.com //连预发用
127.0.0.1 video.yqqxiu.com //连测试用
```

4、修改env文件夹下的local.js 文件

```javascript
const { host, plugin, version, projectname, prev, css, upload } = require('./test');
```

5、运行命令（因为引用内部包，需要内网环境）
```
yarn && yarn start
或者
sudo yarn && yarn start
```

6、先去 http://www.yqxiu.cn 注册登录测试环境

7、浏览器访问 http://video.yqxiu.cn/video/index 
