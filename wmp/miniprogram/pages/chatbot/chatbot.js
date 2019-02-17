// miniprogram/pages/chatbot/chatbot.js
var MS_SLEEP_IMPROVE_ID = 13
var MS_SLEEP_IMPROVE_NEXT = 14
var TIMEOUT_MSG_BEFORE = 0
var TIMEOUT_MSG_AFTER_FACTOR = 0

Page({

  /**
   * 页面的初始数据
   */
  data: {
    chat: [
      {
        content: 'Hi！(｡･∀･)ﾉﾞ你好呀，很高兴见到你！',
        type: 'chatbot'
      },
      {
        content: '自我介绍一下，我叫眠眠，由哥伦比亚大学超级厉害研究院设计，是你的私人定制小机器人，帮助你更好地应对睡眠问题。',
        type: 'chatbot'
      },
      {
        content: '你好呀',
        type: 'user'
      },
      {
        content: '每天想睡多久呢？',
        type: 'chatbot'
      },
    ],
    option_display: true,
    option_type: 'time_selector',
    options: [],
    send_state: "disabled",
    picker: {
      template: "我想要每天睡 {} 小时",
      content: "我想要每天睡 ___ 小时",
      value: -1,
      range: [6, 7, 8, 9, 10],
      text: ["6", "7", "8", "9", "10"],
      index: 2,
    },
    scrollTop: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.loadChatScriptFromDb("main_flow")
  },

  /**
   * Loads chat script config from db.
   */
  loadChatScriptFromDb: function (name) {
    const db = wx.cloud.database()
    db.collection('chatflow').where({
      name: name
    }).get({
      success: res => {
        this.chat_flow = res.data[0]
        this.loadMessage(0)
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '连接失败'
        })
        console.error('[数据库] [查询记录] 失败：', err)
      }
    })
  },

  getMultiselectCallback: function (id) {
    switch (id) {
      case MS_SLEEP_IMPROVE_ID: 
        return this.callbackSleepImprovement
        break
      default:
        console.log('callback id ', id, ' not found.')
        break
    }
  },

  callbackSleepImprovement: function (content, checks) {
    let lines = []
    for (let i = 0; i < content.length; i++) {
      if (checks[i]) {
        lines.push(content[i])
      }
    }
    return {
      next: MS_SLEEP_IMPROVE_NEXT,
      text: lines.join("，")
    }
  },

  /**
   * Chat message display.
   */
  scrollToBottom: function () {
    let len = this.data.chat.length
    this.setData({
      scrollTop: len * 1000,
    })
  },

  sendMessage: function (message, type) {
    this.data.chat.push({ type: type, content: message })
    this.setData({
      chat: this.data.chat
    })
    this.scrollToBottom()
  },

  loadMessage: function (id) {
    if (id == -1) {
      return
    }
    let message = this.chat_flow[id]
    if (message.type == "CHATBOT") {
      this.addChatbotMessage(message.content[0])
    }
    else if (message.type == "USER") {
      if (message.single_select) {
        this.addSingleSelect(message.content)
      } else {
        this.addMultiSelect(message.content, id)
      }
    }
  },

  addChatbotMessage: function (content) {
    setTimeout(function () {
      this.sendMessage(content.text, "chatbot")
    }.bind(this), TIMEOUT_MSG_BEFORE)
    let len = content.text.length
    setTimeout(function () {
      this.loadMessage(content.next)
    }.bind(this), len * TIMEOUT_MSG_AFTER_FACTOR)
  },

  addSingleSelect: function (content) {
    for (let i = 0; i < content.length; i++) {
      let option = content[i]
      this.data.options.push({
        content: option.option,
        text: option.text,
        next: option.next
      })
    }
    this.setData({
      options: this.data.options,
      option_display: true,
      option_type: "single"
    })
    this.scrollToBottom()
  },

  addMultiSelect: function (content, id) {
    for (let i = 0; i < content.length; i++) {
      let option = content[i]
      this.data.options.push({
        content: option.option,
        text: option.text,
        unique: option.unique,
      })
    }
    this.setData({
      options: this.data.options,
      option_display: true,
      option_type: 'multiple',
      multiselect_callback: this.getMultiselectCallback(id)
    })
    this.scrollToBottom()
  },

  /**
   * Chat UI interactions.
   */
  onSingleCheck: function (e) {
    let id = parseInt(e.target.id)
    let option = this.data.options[id]
    this.setData({ 
      options: [],
      option_display: false })
    this.sendMessage(option.text, "user")
    this.loadMessage(option.next)
  },

  onMultiCheck: function (e) {
    let id = parseInt(e.target.id)
    let len = this.data.options.length
    // Toggle current selection.
    this.data.options[id].checked = !this.data.options[id].checked
    // Toggle other selections.
    for (let i = 0; i < len; i++) {
      if (this.data.options[id].unique != this.data.options[i].unique) {
        this.data.options[i].checked = false;
      }
    }
    // Refresh style.
    let checked = false;
    for (let i = 0; i < len; i++) {
      checked |= this.data.options[i].checked;
      this.data.options[i].class = this.data.options[i].checked ? "checked" : ""
    }
    this.data.option_state = checked ? "" : "disabled"
    this.setData({options: this.data.options, option_state: this.data.option_state})
  },

  onMultiSend: function (e) {
    if (this.data.option_state == "disabled") {
      return
    }
    let contents = []
    let check = []
    for (let i = 0; i < this.data.options.length; i++) {
      contents.push(this.data.options[i].text)
      check.push(this.data.options[i].checked)
    }
    let res = this.data.multiselect_callback(contents, check)
    this.setData({ 
      options: [], 
      option_display: false
    })
    this.sendMessage(res.text, "user")
    this.loadMessage(res.next)
  },

  onPickerChange: function (e) {
    let index = e.detail.value
    let content = this.data.picker.template.replace('{}', this.data.picker.text[index])
    this.data.picker.value = index
    this.data.picker.index = index
    this.data.picker.content = content
    this.data.picker.class = "checked"
    this.setData({
      picker: this.data.picker,
      send_state: true
    })
  },

  onPickerSend: function (e) {
    this.sendMessage(this.data.picker.content, "user")
    this.setData({
      picker: {},
      option_display: false
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})