<template>
  <div>
    <div class="img-box">
      <img :src="imgHaibao" />
    </div>
    <div style="text-align: left; line-height: 2rem; font-size: 0.8rem">
      <div class="top-item">
        <span style="font-weight: 600">当前版本: {{ store.curDice.baseInfo.version }}</span>
      </div>
      <div class="top-item">
        <span style="font-weight: 600">最新版本: {{ store.curDice.baseInfo.versionNew }}</span>
      </div>
      <div class="top-item" style="font-family: sans-serif; margin-top: 1rem">
        官方网站:
        <el-link type="primary" target="_blank" href="https://www.sealdice.com"
          >https://www.sealdice.com</el-link
        >
      </div>
      <div class="top-item" style="font-family: sans-serif">
        使用手册:
        <el-link type="primary" target="_blank" href="https://dice.weizaima.com/manual/"
          >https://dice.weizaima.com/manual/</el-link
        >
      </div>
      <div class="top-item" style="font-family: sans-serif">
        投喂海豹:
        <el-link type="primary" target="_blank" href="https://dice.weizaima.com/feed/"
          >https://dice.weizaima.com/feed/</el-link
        >
      </div>
      <div class="top-item" style="font-family: sans-serif">
        源码:
        <el-link type="primary" target="_blank" href="https://github.com/sealdice/sealdice-core/"
          >https://github.com/sealdice/sealdice-core</el-link
        >
      </div>
      <div class="top-item">
        <div style="margin-top: 5rem; font-family: sans-serif"></div>
      </div>
    </div>
  </div>

  <div style="text-align: center; font-weight: bold; font-size: 1.3rem; margin-top: 4rem">
    感谢 ♪(･ω･)ﾉ
  </div>
  <div style="text-align: center; font-size: small; margin-bottom: 2rem; font-family: sans-serif">
    特别鸣谢参与测试、反馈问题，帮助完善海豹指令的各位！以下列出感谢名单（排名不分先后）
  </div>
  <div class="about">
    <div></div>
    <div class="subtitle">社区协力</div>

    <div style="margin-top: 2rem" class="subtitle">V1.5 版本</div>
    <div class="developers">
      <el-link :underline="false" href="https://github.com/fy0" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/fy0'" />木落</el-link
      >
      <el-link :underline="false" href="https://github.com/PaienNate" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/PaienNate'" />PaienNate</el-link
      >
      <el-link :underline="false" href="https://github.com/Fripine" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Fripine'" />Fripine</el-link
      >
      <el-link :underline="false" href="https://github.com/JustAnotherID" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          style="border: 1px solid #aaa"
          :src="urlBase + '/sd-api/utils/ga/JustAnotherID'" />只是另一个ID</el-link
      >
      <el-link :underline="false" href="https://github.com/MintCider" target="_blank"
        ><el-avatar shape="circle" :size="50" :src="urlBase + '/sd-api/utils/ga/MintCider'" />Mint
        Cider</el-link
      >
      <el-link :underline="false" href="https://github.com/MX-fox" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/MX-fox'" />暮星</el-link
      >
      <el-link :underline="false" href="https://github.com/Xiangze-Li" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Xiangze-Li'" />JohNSoN</el-link
      >
      <el-link :underline="false" href="https://github.com/bugtower100" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/bugtower100'" />Bugtower100</el-link
      >
      <el-link :underline="false" href="https://github.com/charyflys" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/charyflys'" />希望潇洒的风：Ceeling (UI)</el-link
      >
    </div>
    <div style="margin-top: 2rem" class="subtitle">V1.5.0 特别致谢</div>
    <div class="developers">
      <!-- <img  referrerpolicy="no-referrer"  src="https://avatars.githubusercontent.com/u/54656633?v=4&a=1" /> -->
      <el-link :underline="false" href="https://github.com/LoranaAurelia" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/LoranaAurelia'" />雪桃 - 提供新的魔法阵代理</el-link
      >
      <el-link
        :underline="false"
        href="https://dice.weizaima.com/public-dice"
        target="_blank"
        style="color: var(--el-link-text-color); transition: color 3s"
        onmouseover="this.style.color='red'"
        onmouseout="this.style.color='var(--el-link-text-color)'"
        ><el-avatar
          shape="circle"
          :size="50"
          src="https://d1.sealdice.com/images/bird.jpg" />[骰]诺扣提 - 公骰 (协助测试)</el-link
      >

      <el-link :underline="false" href="https://github.com/kenichiLyon" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          src="https://d1.sealdice.com/images/kenichiLyon.jpg" />山本健一 - 协助测试</el-link
      >

      <el-link :underline="false" href="https://github.com/baiyu-yu" target="_blank"
        ><el-avatar shape="circle" :size="50" :src="urlBase + '/sd-api/utils/ga/baiyu-yu'" />白鱼 -
        协助测试</el-link
      >

      <el-link :underline="false" href="#/about" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          src="https://firehomework.top/img/6819CBB71F64D7BBFC90DCF4432B76BC.jpg" />[骰]Gaza(3658887052)
        - 协助测试</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.4 版本</div>
    <div class="developers">
      <!-- <img  referrerpolicy="no-referrer"  src="https://avatars.githubusercontent.com/u/54656633?v=4&a=1" /> -->
      <el-link :underline="false" href="https://github.com/JustAnotherID" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          style="border: 1px solid #aaa"
          :src="urlBase + '/sd-api/utils/ga/JustAnotherID'" />只是另一个ID</el-link
      >
      <el-link :underline="false" href="https://github.com/Szzrain" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Szzrain'" />Szzrain</el-link
      >
      <el-link :underline="false" href="https://github.com/Xiangze-Li" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Xiangze-Li'" />JohNSoN</el-link
      >
      <el-link :underline="false" href="https://github.com/oissevalt" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/oissevalt'" />檀轶步棋</el-link
      >
      <el-link :underline="false" href="https://github.com/FlameTEXT" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/FlameTEXT'" />脑</el-link
      >
      <el-link :underline="false" href="https://github.com/fy0" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/fy0'" />木落</el-link
      >
      <el-link :underline="false" href="https://github.com/Director259" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Director259'" />Director259</el-link
      >
      <el-link :underline="false" href="https://github.com/VolEurr0Se" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/VolEurr0Se'" />浣熊旅記(dnd5文档)</el-link
      >
      <el-link :underline="false" href="https://github.com/zeroxilo" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/zeroxilo'" />调零(dnd5文档)</el-link
      >
      <el-link :underline="false" href="https://github.com/cherrybird7" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/cherrybird7'" />凤吹风雪(7版怪锤)</el-link
      >
      <el-link :underline="false" href="javascript:void(0)"
        ><el-avatar shape="circle" :size="50" :src="imgHaibao" />奈亚猫猫汉化组(7版怪锤)</el-link
      >
      <el-link :underline="false" href="javascript:void(0)"
        ><el-avatar shape="circle" :size="50" :src="imgHaibao" />稚鸢音(7版怪锤)</el-link
      >
      <el-link :underline="false" href="https://github.com/Fripine" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Fripine'" />Fripine</el-link
      >
      <el-link :underline="false" href="https://github.com/MintCider" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/MintCider'" />逐风</el-link
      >
      <el-link :underline="false" href="https://github.com/yichere" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/yichere'" />炽热</el-link
      >
      <el-link :underline="false" href="https://github.com/MX-fox" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/MX-fox'" />暮星</el-link
      >
      <el-link :underline="false" href="https://github.com/0018cha" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/0018cha'" />0.018</el-link
      >
      <el-link :underline="false" href="https://github.com/shakugannosaints" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/shakugannosaints'" />冷筱华</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.4 安卓端</div>
    <div class="developers">
      <!-- <img  referrerpolicy="no-referrer"  src="https://avatars.githubusercontent.com/u/54656633?v=4&a=1" /> -->
      <el-link :underline="false" href="https://github.com/Szzrain" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Szzrain'" />Szzrain</el-link
      >
      <el-link :underline="false" href="https://github.com/PaienNate" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/PaienNate'" />PaienNate</el-link
      >
      <el-link :underline="false" href="https://github.com/fy0" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/fy0'" />木落</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.4.5 特别致谢</div>
    <div class="developers">
      <!-- <img  referrerpolicy="no-referrer"  src="https://avatars.githubusercontent.com/u/54656633?v=4&a=1" /> -->
      <el-link :underline="false" href="https://github.com/Linwenxuan05" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Linwenxuan05'" />Linwenxuan05</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.3 版本</div>
    <div class="developers">
      <!-- <img  referrerpolicy="no-referrer"  src="https://avatars.githubusercontent.com/u/54656633?v=4&a=1" /> -->
      <el-link :underline="false" href="https://github.com/JustAnotherID" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          style="border: 1px solid #aaa"
          :src="urlBase + '/sd-api/utils/ga/JustAnotherID'" />只是另一个ID</el-link
      >
      <el-link :underline="false" href="https://github.com/Szzrain" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Szzrain'" />Szzrain</el-link
      >
      <el-link :underline="false" href="https://github.com/Xiangze-Li" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Xiangze-Li'" />JohNSoN</el-link
      >
      <el-link :underline="false" href="https://github.com/oissevalt" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/oissevalt'" />檀轶步棋</el-link
      >
      <el-link :underline="false" href="https://github.com/FlameTEXT" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/FlameTEXT'" />脑</el-link
      >
      <el-link :underline="false" href="https://github.com/fy0" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/fy0'" />木落</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.3 安卓端</div>
    <div class="developers">
      <!-- <img  referrerpolicy="no-referrer"  src="https://avatars.githubusercontent.com/u/54656633?v=4&a=1" /> -->
      <el-link :underline="false" href="https://github.com/Szzrain" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Szzrain'" />Szzrain</el-link
      >
      <el-link :underline="false" href="https://github.com/PaienNate" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/PaienNate'" />PaienNate</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.2 版本</div>
    <div class="developers">
      <!-- <img  referrerpolicy="no-referrer"  src="https://avatars.githubusercontent.com/u/54656633?v=4&a=1" /> -->
      <el-link :underline="false" href="https://github.com/fy0" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/fy0'" />木落</el-link
      >
      <el-link :underline="false" href="https://github.com/Szzrain" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Szzrain'" />Szzrain</el-link
      >
      <el-link :underline="false" href="https://github.com/yuyannuo" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/yuyannuo'" />于言诺</el-link
      >
      <el-link :underline="false" href="https://github.com/oissevalt" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/oissevalt'" />檀轶步棋</el-link
      >
      <el-link :underline="false" href="https://github.com/FlameTEXT" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/FlameTEXT'" />脑</el-link
      >
      <el-link :underline="false" href="https://github.com/SunnyJoyce" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/SunnyJoyce'" />熊米</el-link
      >
      <el-link :underline="false" href="https://github.com/VolEurr0Se" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/VolEurr0Se'" />浣熊旅記</el-link
      >
      <el-link :underline="false" href="https://github.com/lxy071130" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/lxy071130'" />流溪</el-link
      >
      <el-link :underline="false" href="https://github.com/nodisease" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/nodisease'" />病</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.2 安卓端</div>
    <div class="developers">
      <!-- <img  referrerpolicy="no-referrer"  src="https://avatars.githubusercontent.com/u/54656633?v=4&a=1" /> -->
      <el-link :underline="false" href="https://github.com/96368a" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/96368a'" />木末君</el-link
      >
      <el-link :underline="false" href="https://github.com/Szzrain" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Szzrain'" />Szzrain</el-link
      >
      <el-link :underline="false" href="https://github.com/JiYeHuanXiang" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/JiYeHuanXiang'" />极夜幻想</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.1 版本</div>
    <div>Szzrain - 实现了Discord和Kook(开黑啦)两个平台的海豹接入</div>
    <div>
      于言诺 -
      制作了很多海豹扩展和牌堆，如养猫、踢海豹、赛博功德、风味月饼、万圣节糖果等等……协助撰写了一些海豹的文档和教程，并找出了众多海豹的bug
    </div>
    <div>云陌 - 海豹文档教程协力，同时也找了很多海豹的bug</div>
    <div>
      <el-link href="https://github.com/kagangtuya-star" target="_blank">星尘</el-link>
      - 编写了海豹同网络登录的教程，友情提供了用于指令参考的fvtt。以及一些建议和bug反馈
    </div>

    <div style="margin-top: 2rem" class="subtitle">V1.0版本</div>
    <div>Ariel船长 - 早期测试参与者，协助解决登录流程问题</div>
    <div>Raycel - 早期测试参与者，协助解决登录流程问题</div>
    <div>kuma - 早期测试参与者，海豹的第一次全指令全流程测试</div>
    <div>卟啵 - 早期测试参与者，回报了中文路径和空格路径问题，协助解决了登录流程问题</div>
    <div>蜜瓜包 - 早期测试参与者，默认文档中“怪物之锤查询”的编纂者之一</div>
    <div>
      月森优姬 -
      早期测试参与者，提出了大量各种各样建议和BUG反馈，纠正了一些与规则书不统一的问题，COC同义词和默认技能点数的编纂者
    </div>
    <div>清茶 - 在4月7日的可靠性测试中，参与构造了让旧版海豹进程崩溃的指令</div>
    <div>脑 - 在4月7日的可靠性测试中，参与构造了让旧版海豹进程崩溃的指令</div>
    <div>Greed锦鲤 - 在4月7日的可靠性测试中，参与构造了让旧版海豹进程崩溃的指令</div>
    <div>格莱德 - 在4月7日的可靠性测试中，参与构造了让旧版海豹进程崩溃的指令</div>
    <div>我来逛街 - 提出很多建议；帮助改进了DND5E同义词列表，增加许多常用说法</div>

    <div style="margin-top: 2rem" class="subtitle">手册编写</div>
    <div class="developers">
      <el-link :underline="false" href="https://github.com/JustAnotherID" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          style="border: 1px solid #aaa"
          :src="urlBase + '/sd-api/utils/ga/JustAnotherID'" />只是另一个ID</el-link
      >
      <el-link :underline="false" href="https://github.com/Xiangze-Li" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Xiangze-Li'" />JohNSoN</el-link
      >
      <el-link :underline="false" href="https://github.com/MX-fox" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/MX-fox'" />暮星</el-link
      >
      <el-link :underline="false" href="https://github.com/Szzrain" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Szzrain?v=1'" />Szzrain</el-link
      >
      <el-link :underline="false" href="https://github.com/fy0" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/fy0'" />木落</el-link
      >
      <el-link :underline="false" href="https://github.com/kenichiLyon" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          src="https://d1.sealdice.com/images/kenichiLyon.jpg" />山本健一</el-link
      >
      <el-link :underline="false" href="https://github.com/MintCider" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/MintCider'" />逐风</el-link
      >
      <el-link :underline="false" href="https://github.com/f44r" target="_blank"
        ><el-avatar shape="circle" :size="50" :src="urlBase + '/sd-api/utils/ga/f44r'" />脑</el-link
      >
      <el-link :underline="false" href="https://github.com/bugtower100" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/bugtower100'" />Bugtower</el-link
      >
      <el-link :underline="false" href="https://github.com/Mitxoleta" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Mitxoleta'" />Monad</el-link
      >
      <el-link :underline="false" href="https://github.com/yichirehuijian" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/yichirehuijian'" />以炽热挥剑</el-link
      >
      <el-link :underline="false" href="https://github.com/oissevalt" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/oissevalt'" />檀轶步棋</el-link
      >
      <el-link :underline="false" href="https://github.com/lxy071130" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/lxy071130'" />流溪</el-link
      >
      <el-link :underline="false" href="https://github.com/PaienNate" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/PaienNate'" />PaienNate</el-link
      >
      <el-link :underline="false" href="https://github.com/nodisease" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/nodisease'" />病</el-link
      >
      <el-link :underline="false" href="https://github.com/Stanlty998" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/Stanlty998'" />綮小灰</el-link
      >
      <el-link :underline="false" href="https://github.com/-" target="_blank"
        ><el-avatar
          shape="circle"
          :size="50"
          :src="urlBase + '/sd-api/utils/ga/-'" />大概不全，下版本纠正……</el-link
      >
    </div>

    <div style="margin-top: 2rem" class="subtitle">参考</div>
    <div>斯塔尼亚 - 塔系核心作者，指令实现过程中部分参考了塔系核心的指令表现</div>
    <div>赵喵喵 - ZhaoDice作者，早期指令参考之一</div>
    <div>Dice!核心的开发者们 - 同样的，在骰点格式和输出表现方面进行了参考</div>
    <div>FVTT - 经典的DND跑团平台，指令参考之一</div>
  </div>

  <!-- <div class="tip">
    <p class="title">TIP</p>
    <div>特别注意：内测版意味着尚不完全稳定，配置文件有可能发生不兼容的变化。请谨慎使用。</div>
  </div> -->
</template>

<script lang="ts" setup>
import { useStore } from '~/store';
import imgHaibao from '~/assets/haibao1.png';
import { urlBase } from '~/backend';

const store = useStore();

onBeforeMount(async () => {
  await store.logFetchAndClear();
});

onBeforeUnmount(() => {
  // clearInterval(timerId)
});
</script>

<style scoped lang="css">
.img-box {
  height: 250px;
  margin-right: 3rem;
  float: left;

  img {
    height: 200px;
  }
}

.about {
  background-color: #fff;
  padding: 2rem;
  line-height: 2rem;
  text-align: left;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.12),
    0 0 6px rgba(0, 0, 0, 0.04);
}

.subtitle {
  margin-bottom: 1rem;
  font-weight: bold;
}

.developers {
  line-height: 4rem;
}

.developers .el-avatar {
  margin-right: 0.5rem;
}

.developers > * {
  margin-right: 2rem;
}
</style>
