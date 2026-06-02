<template>
  <el-config-provider namespace="el">
    <el-container class="app-shell">
      <el-aside class="sidebar" width="260px">
        <div class="brand">
          <div class="brand-mark">LC</div>
          <div>
            <h1>LangChain</h1>
            <p>Chat Workbench</p>
          </div>
        </div>

        <div class="model-picker">
          <div class="model-picker-label">聊天模型</div>
          <el-select
            v-model="selectedChatModel"
            class="model-select"
            :loading="isLoadingModels"
            :disabled="isLoadingModels || chatModels.length === 0"
            placeholder="请选择模型"
            filterable
            @change="handleModelChange"
          >
            <el-option
              v-for="model in chatModels"
              :key="model.langchain_model"
              :label="model.name"
              :value="model.langchain_model"
            >
              <div class="model-option">
                <span>{{ model.name }}</span>
                <small>{{ model.description }}</small>
              </div>
            </el-option>
          </el-select>
          <p class="model-description">
            {{ modelStatusText }}
          </p>
        </div>

        <el-button class="new-chat" type="primary" :icon="Plus" @click="startNewChat">
          新建会话
        </el-button>

        <el-menu class="conversation-menu" :default-active="activeConversation" @select="activeConversation = $event">
          <el-menu-item v-for="item in conversations" :key="item.id" :index="item.id">
            <el-icon><ChatLineRound /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container class="main-panel">
        <el-header class="chat-header" height="72px">
          <div>
            <h2>{{ currentConversation.title }}</h2>
            <p>基于 Vue 3 + Element Plus 的聊天页面框架</p>
          </div>
          <el-tag type="success" effect="light">在线</el-tag>
        </el-header>

        <el-main class="chat-main">
          <div class="message-list">
            <div
              v-for="message in currentConversation.messages"
              :key="message.id"
              class="message-row"
              :class="message.role"
            >
              <div class="avatar">{{ message.role === 'user' ? '我' : 'AI' }}</div>
              <div class="bubble">
                <div class="sender">{{ message.role === 'user' ? '用户' : '助手' }}</div>
                <p>{{ message.content }}</p>
              </div>
            </div>
          </div>
        </el-main>

        <el-footer class="input-footer" height="128px">
          <div class="composer">
            <el-input
              v-model="draft"
              class="composer-input"
              type="textarea"
              resize="none"
              :autosize="{ minRows: 2, maxRows: 3 }"
              placeholder="输入消息，按 Enter 发送，Shift + Enter 换行"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <el-button
              class="send-button"
              type="primary"
              :icon="Promotion"
              :loading="isSendingMessage"
              :disabled="chatModels.length === 0"
              @click="sendMessage"
            >
              发送
            </el-button>
            <el-button class="clear-button" :icon="Delete" @click="clearMessages">
              清屏
            </el-button>
          </div>
        </el-footer>
      </el-container>
    </el-container>
  </el-config-provider>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ChatLineRound, Delete, Plus, Promotion } from '@element-plus/icons-vue'
import { httpClient } from './services/httpClient'

const activeConversation = ref('intro')
const draft = ref('')
const chatModels = ref([])
const selectedChatModel = ref('')
const isLoadingModels = ref(false)
const isSendingMessage = ref(false)
const modelsLoadError = ref('')
const conversations = ref([
  {
    id: 'intro',
    title: '默认会话',
    messages: [
      { id: 1, role: 'assistant', content: '你好，这里是聊天展示区。左侧可以放会话列表、知识库或功能入口。' },
      { id: 2, role: 'user', content: '底部输入框已经固定在右侧区域底部。' },
      { id: 3, role: 'assistant', content: '后续可以在 sendMessage 中接入 LangChain 或后端 API。' },
    ],
  },
  {
    id: 'qa',
    title: '知识库问答',
    messages: [
      { id: 1, role: 'assistant', content: '请选择知识库后开始提问。' },
    ],
  },
  {
    id: 'agent',
    title: 'Agent 调试',
    messages: [
      { id: 1, role: 'assistant', content: '这里可以展示工具调用、日志和 Agent 推理过程。' },
    ],
  },
])

const currentConversation = computed(() => {
  return conversations.value.find((item) => item.id === activeConversation.value) || conversations.value[0]
})

const selectedModel = computed(() => {
  return chatModels.value.find((model) => model.langchain_model === selectedChatModel.value)
})

const selectedModelIndex = computed(() => {
  const index = chatModels.value.findIndex((model) => model.langchain_model === selectedChatModel.value)
  return index >= 0 ? index : 0
})

const modelStatusText = computed(() => {
  if (isLoadingModels.value) return '正在加载模型列表...'
  if (modelsLoadError.value) return modelsLoadError.value
  if (selectedModel.value) return selectedModel.value.description
  return '暂无可用模型'
})

onMounted(() => {
  loadChatModels()
})

function startNewChat() {
  const id = `chat-${Date.now()}`
  conversations.value.unshift({
    id,
    title: `新会话 ${conversations.value.length + 1}`,
    messages: [
      { id: 1, role: 'assistant', content: '新会话已创建，请输入你的问题。' },
    ],
  })
  activeConversation.value = id
}

async function loadChatModels() {
  isLoadingModels.value = true
  modelsLoadError.value = ''

  try {
    const data = await httpClient.getAgentModels()
    const models = Array.isArray(data.chat_models) ? data.chat_models : []
    console.log('[loadChatModels] parsed chat_models:', models)

    chatModels.value = models

    if (models.length === 0) {
      console.log('[loadChatModels] no chat models returned')
      selectedChatModel.value = ''
      modelsLoadError.value = '接口未返回聊天模型'
      return
    }

    const defaultIndex = Number.isInteger(data.default_chat_model_index) ? data.default_chat_model_index : 0
    const defaultModel = models[defaultIndex] || models[0]
    console.log('[loadChatModels] default selection:', {
      defaultIndex,
      defaultModel,
      selectedValue: defaultModel.langchain_model,
    })

    selectedChatModel.value = defaultModel.langchain_model
  } catch (error) {
    chatModels.value = []
    selectedChatModel.value = ''
    modelsLoadError.value = '模型列表加载失败'
    console.error('Failed to load chat models:', error)
  } finally {
    isLoadingModels.value = false
  }
}

function handleModelChange(value) {
  console.info('Selected chat model:', value)
}

function clearMessages() {
  currentConversation.value.messages = []
}

async function sendMessage() {
  const content = draft.value.trim()
  if (!content || isSendingMessage.value) return

  currentConversation.value.messages.push({
    id: Date.now(),
    role: 'user',
    content,
  })
  draft.value = ''
  isSendingMessage.value = true

  try {
    const data = await httpClient.sendMessage({
      question: content,
      modelIndex: selectedModelIndex.value,
    })

    currentConversation.value.messages.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: getAssistantReply(data),
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    currentConversation.value.messages.push({
      id: Date.now() + 1,
      role: 'assistant',
      content: '消息发送失败，请稍后重试。',
    })
  } finally {
    isSendingMessage.value = false
  }
}

function getAssistantReply(data) {
  if (typeof data === 'string') return data
  return data?.answer || data?.content || data?.message || JSON.stringify(data)
}
</script>
