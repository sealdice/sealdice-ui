<template>
  <div class="flex flex-col h-full">
    <div class="mb-3 flex justify-end">
      <div class="flex justify-center">
        <el-text>测试模式：</el-text>
        <el-radio-group v-model="mode" size="small">
          <el-radio-button value="private">私聊</el-radio-button>
          <el-radio-button value="group">群</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto" ref="chat">
      <div class="talk-item" v-for="i in store.talkLogs" :class="!i.isSeal ? 'mine' : ''" v-show="i.mode === mode">
        <div class="left">
          <el-avatar
            :shape="i.isSeal ? 'circle' : 'square'"
            :size="60"
            :src="i.isSeal ? imgSeal:imgMe"
          />
        </div>
        <div class="right">
          <div class="name">{{ i.isSeal ? '海豹核心' : i.name }}</div>
          <div class="content">{{ i.content }}</div>
        </div>
      </div>
    </div>

    <div class="flex items-center">
      <el-autocomplete class="flex-1" ref="autocomplete" v-model="input"
                       :fetch-suggestions="querySearch" :trigger-on-focus="false" @select="inputChanged" @keyup.enter="doSend"
                       placeholder="来试一试，回车键发送"/>
      <el-button class="ml-2.5 min-w-12" type="primary" @click="doSend">发送</el-button>
      <el-popover placement="top" trigger="click">
        <template #reference>
          <el-button :icon="Plus" circle/>
        </template>
        <el-space class="w-full flex flex-col justify-center" fill>
          <el-button text @click="reloadDeck" :disabled="deckReloading">重载牌堆</el-button>
          <el-button text @click="reloadJs" :disabled="jsReloading">重载JS</el-button>
          <el-button text @click="reloadHelpdoc" :disabled="helpdocReloading">重载帮助文件</el-button>
        </el-space>
      </el-popover>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~/store';
import imgSeal from '~/assets/seal.png'
import imgMe from '~/assets/me.jpg'
import { Plus } from '@element-plus/icons-vue'

const store = useStore()

const mode = ref<'private' | 'group'>('private')

let timerMsg: number
onBeforeMount(async () => {
  restaurants.value = loadAll()
    timerMsg = setInterval(async () => {
        try {
            let msg = await store.getRecentMessage()
          console.log('msg:', msg)
            for (let i of msg) {
                store.talkLogs.push({
                    content: i.message,
                    isSeal: true,
                    mode: i.messageType,
                })
            }
            if (msg.length) {
              // 拉下滚动条
              nextTick(() => {
                const el = chat.value as any
                if (el) {
                  el.scrollTop = el.scrollHeight
                }
              })
            }
        } catch (e: any) {

        }
    }, 1000) as any
})

onBeforeUnmount(() => {
  clearInterval(timerMsg)
})

const restaurants = ref<RestaurantItem[]>([])

interface RestaurantItem {
  value: string
  link: string
}

const input = ref("")

const chat = ref(null)
const autocomplete = ref(null)

let lastTime = 0

const inputChanged = () => {
  lastTime = Date.now()
}

const doSend = async () => {
  if (input.value === "") {
    return
  }
  // 我的机器上至少要50ms，其实应该有更好的办法
  if (Date.now() - lastTime > 300) {
    const text = input.value
    store.talkLogs.push({
      name: '',
      content: text,
      isSeal: false,
      mode: mode.value
    })
    try {
      await store.diceExec(text, mode.value)
      // for (let i of ret) {
      //   store.talkLogs.push({
      //     content: i.message,
      //     isSeal: true
      //   })
      // }
    } catch (e) {
      store.talkLogs.push({
        name: '',
        content: '消息过于频繁',
        isSeal: true,
        mode: mode.value
      })
    }

    nextTick(() => {
      const el = chat.value as any
      if (el) {
        el.scrollTop = el.scrollHeight
      }


      const elAc = autocomplete.value as any
      if (elAc) {
        elAc.suggestions = [];
      }
      input.value = ''
    })
  }
}

const querySearch = (queryString: string, cb: any) => {
  // console.log(queryString, input.value)
  const results = input.value
    ? restaurants.value.filter(createFilter(input.value))
    : []
  // call callback function to return suggestions
  cb(results)
}

const createFilter = (queryString: string) => {
  return (restaurant: RestaurantItem) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}
const loadAll = () => {
  const raw = '死亡豁免 spellslots character dlongrest 法术位 longrest botlist 查询 setcoc 咕咕 master 长休 角色 dcast reply dbuff gugu roll buff send name char drcv jrrp help find text cast draw init deck drav dndx rch dst drc rah log dnd rhd coc rhx ext dss rcv set rav bot li st st en ti ri sc ra rc rc ds rh rd pc nn ch rx ss r'
  const ret = []
  for (const i of raw.split(' ')) {
    ret.push({ value: '.'+i, link: '' })
  }
  ret.reverse()
  return ret
}

const deckReloading = ref<boolean>(false)
const reloadDeck = async () => {
  deckReloading.value = true
  const ret = await store.deckReload()
  if (ret.testMode) {
    ElMessage.success('展示模式无法重载牌堆')
  } else {
    ElMessage.success('已重载牌堆')
  }
  deckReloading.value = false
}

const jsReloading = ref<boolean>(false)
const reloadJs = async () => {
  jsReloading.value = true
  const ret = await store.jsReload()
  if (ret && ret?.testMode) {
    ElMessage.success('展示模式无法重载JS')
  } else {
    ElMessage.success('已重载JS')
  }
  jsReloading.value = false
}

const helpdocReloading = ref<boolean>(false)
const reloadHelpdoc = async () => {
  helpdocReloading.value = true
  const ret = await store.helpDocReload()
  if (ret && ret?.result) {
    ElMessage.success('已重载帮助文档')
  } else {
    ElMessage.success( ret.err || '无法重载帮助文档')
  }
  helpdocReloading.value = false
}
</script>

<style scoped lang="css">
.about {
  background-color: #fff;
  padding: 2rem;
  line-height: 2rem;
  text-align: left;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

.talk-item {
  display: flex;
  margin-bottom: 2rem;

  &.mine {
    direction: rtl;
    & > .right > .content {
      background-color: #26c5fd;
      direction: ltr;
    }
  }

  & > .right {
    padding-left: 1rem;
    padding-right: 1rem;
    & > .name {
      font-size: smaller;
      line-height: 2rem;
      min-height: 2rem;
      color: #707070;
    }
    & > .content {
      background-color: #fff;
      padding: .7rem;
      border-radius: 9px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  }
}
</style>
