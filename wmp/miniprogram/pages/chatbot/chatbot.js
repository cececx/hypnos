// miniprogram/pages/chatbot/chatbot.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    chat: [],
    show_options: false,
    single_select: false,
    options: [],
    option_state: "disabled",
    scrollTop: 0,
  },

  onSingleCheck: function (e) {
    let id = parseInt(e.target.id)
    let option = this.data.options[id]
    this.setData({ 
      options: [],
      show_options: false })
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
      show_options: false
    })
    this.sendMessage(res.text, "user")
    this.loadMessage(res.next)
  },

  scrollToBottom: function() {
    let len = this.data.chat.length
    this.setData({
      scrollTop: len * 1000,
    })
  },

  sendMessage: function(message, type) {
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
        this.addMultiSelect(message.content)
      }
    }
  },

  addChatbotMessage: function (content) {
    setTimeout(function () {
      this.sendMessage(content.text, "chatbot")
    }.bind(this), 500)
    let len = content.text.length
    setTimeout(function () {
      this.loadMessage(content.next)
    }.bind(this), len * 40)
  },

  addSingleSelect: function (content) {
    for (let i = 0; i < content.length; i++) {
      let option = content[i]
      if (!option.option) {
        option.option = option.text
      }
      this.data.options.push({
        content: option.option,
        text: option.text,
        next: option.next
      })
    }
    this.setData({
      options: this.data.options, 
      show_options: true,
      single_select: true
    })
    this.scrollToBottom()
  },

  addMultiSelect: function (content) {
    for (let i = 0; i < content.options.length; i++) {
      let option = content.options[i]
      if (!option.option) {
        option.option = option.text
      }
      this.data.options.push({
        content: option.option,
        text: option.text,
        unique: option.unique,
      })
    }
    this.setData({
      options: this.data.options,
      show_options: true,
      single_select: false,
      multiselect_callback: content.callback
    })
    this.scrollToBottom()
  },

  chat_flow: {
    0: {
      id: 0,
      type: 'CHATBOT',
      content: [{
        text: 'Hi！(｡･∀･)ﾉﾞ你好呀，很高兴见到你！',
        next: 1,
      }],
    },
    1: {
      id: 1,
      type: 'CHATBOT',
      content: [{
        text: '我可以叫你xx（微信名）吗？',
        next: 2,
      }]
    },
    2: {
      id: 2,
      type: 'USER',
      single_select: true,
      content: [
        {
          text: '好呀',
          next: 5,
        },
        {
          text: '换个称呼',
          next: 3,
        },
      ],
    },
    3: {
      id: 3,
      type: 'CHATBOT',
      content: [{
        text: '你希望我叫你什么呢？',
        next: 4,
      }]
    },
    4: {
      id: 1,
      type: 'USER',
      single_select: true,
      content: [{
        option: '暂时不支持改名字所以你就叫这个吧lol',
        text: '啊那就算了吧',
			  next: 5,
      }]
    },
    5: {
      id: 5,
      type: 'CHATBOT',
      content: [{
        text: '自我介绍一下，我叫眠眠，由哥伦比亚大学超级厉害研究院设计，是你的私人定制小机器人，帮助你更好地应对睡眠问题。',
        next: 6,
      }]
    },
    6: {
      id: 6,
      type: 'USER',
      single_select: true,
      content: [
        {
          text: '你好呀',
          next: 7,
        },
        {
          text: 'Aloha',
          next: 7,
        },
      ],
    },
    7: {
      type: 'CHATBOT',
      content: [{
        text: '眠眠主要依据已被大量研究证实有效的睡眠认知行为疗法（CBT-I），融合了自律学习的反馈机制，通过AI技术来帮助你建立正确的睡眠准备行为，进一步提高睡眠质量。',
        next: 8,
      }]
    },
    8: {
      type: 'CHATBOT',
      content: [{
        text: '睡眠认知行为疗法认为睡眠问题是由错误的应对行为和心理造成的。眠眠会帮你制定适合你的行为改变计划，挑战不利于睡眠的想法，通过建立新的行为和思维模式来改善睡眠问题。改变在一开始可能会阻力重重，但你要相信新的行为和思维一定会让你睡得更好，坚持就是胜利✌️',
        next: 9,
      }]
    },
    9: {
      type: 'USER',
      single_select: true,
      content: [{
        text: 'Wow，好啊',
        next: 10,
      }]
    },
    10: {
      type: 'CHATBOT',
      content: [{
        text: '以下省略一些背景说明~',
        next: 11,
      }]
    },
    11: {
      type: 'CHATBOT',
      content: [{
        text: '好哒我们直接跳到多选题！',
        next: 13,
      }]
    },
    13: {
      type: 'CHATBOT',
      content: [{
        text: '你想在哪些方面改进自己的睡眠呢？',
        next: 14,
      }]
    },
    14: {
      type: 'USER',
      single_select: false,
      content: {
        options: [{
          option: '我一般会花半小时以上睡着，我想要更容易地入睡',
          text: '我想要更容易地入睡',
        },
        {
          option: '我在夜里醒来的时间在半小时以上，我想拥有更完整的睡眠',
          text: '我想拥有更完整的睡眠',
        },
        {
          text: '不要太早醒来',
        },
        {
          text: '不要晚睡',
        },
        {
          unique: true,
          text: '以上都不是',
        }],
        callback: function(contents, select) {
          let res = []
          for (let i = 0; i < contents.length; i++) {
            if (select[i]) {
              res.push(contents[i])
            }
          }
          return {
            next: 15,
            text: res.join('，'),
          }
        }
      }
    },
    15: {
      type: 'CHATBOT',
      content: [{
        text: '眠眠记住了！',
        next: 16,
      }]
    },
    16: {
      type: 'CHATBOT',
      content: [{
        text: '今天的测试就到这里啦(♡˃ꇴ˂♡)',
        next: 17,
      }]
    },
    17: {
      type: 'USER',
      single_select: true,
      content: [{
        option: '喵喵喵？？？',
        text: '呵呵，你走吧',
        next: -1,
      }]
    },
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadMessage(0)
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