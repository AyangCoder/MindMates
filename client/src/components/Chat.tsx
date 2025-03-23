import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, List, Avatar, Typography, Tooltip, Dropdown, Space, Menu, Divider, Badge, Select, Tag } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClearOutlined, SettingOutlined, ClockCircleOutlined, DownOutlined, SmileOutlined, PaperClipOutlined, CalendarOutlined, EnvironmentOutlined, LinkOutlined, PlusOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SaveOutlined, MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import './Chat.css';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale'; // 引入中文本地化支持

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  modelId?: string;
  modelName?: string;
  isThinking?: boolean;
  displayContent?: string;
  timestamp: number;
  status?: 'sending' | 'sent' | 'error';
  reactions?: string[];
}

interface ChatProps {
  selectedModels: Array<{
    id: string;
    name: string;
    description: string;
    apiEndpoint: string;
  }>;
  availableModels: Array<{
    id: string;
    name: string;
    description: string;
    apiEndpoint: string;
  }>;
  onModelsChange: (models: Array<{
    id: string;
    name: string;
    description: string;
    apiEndpoint: string;
  }>) => void;
}

interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  timestamp: number;
  modelIds: string[];
}

const Chat: React.FC<ChatProps> = ({ selectedModels, availableModels, onModelsChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingSpeed] = useState(30);
  const [modelReplyOrder, setModelReplyOrder] = useState<string[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 不再需要模拟对话列表数据，直接使用传入的selectedModels
  
  // 当选中的模型变化时，更新回复顺序
  useEffect(() => {
    setModelReplyOrder(selectedModels.map(model => model.id));
  }, [selectedModels]);
  
  // 清空聊天记录
  const clearChat = () => {
    setMessages([]);
    // 如果当前有活跃的对话，也清除当前对话ID
    if (currentConversationId) {
      setCurrentConversationId(null);
    }
  };
  
  // 创建新对话
  const createNewConversation = () => {
    // 清空当前消息
    setMessages([]);
    // 重置当前对话ID
    setCurrentConversationId(null);
  };
  
  // 保存当前对话
  const saveCurrentConversation = () => {
    if (messages.length === 0) return;
    
    const conversationName = `对话 ${format(new Date(), 'MM-dd HH:mm')}`;
    const newConversation: Conversation = {
      id: currentConversationId || Date.now().toString(),
      name: conversationName,
      messages: [...messages],
      timestamp: Date.now(),
      modelIds: selectedModels.map(model => model.id)
    };
    
    if (currentConversationId) {
      // 更新现有对话
      setConversations(prev => 
        prev.map(conv => conv.id === currentConversationId ? newConversation : conv)
      );
    } else {
      // 创建新对话
      setConversations(prev => [...prev, newConversation]);
      setCurrentConversationId(newConversation.id);
    }
    
    // 保存到本地存储
    localStorage.setItem('mindmates-conversations', JSON.stringify([
      ...conversations.filter(conv => conv.id !== currentConversationId),
      newConversation
    ]));
  };
  
  // 加载对话
  const loadConversation = (conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationId(conversation.id);
    }
  };
  
  // 删除对话
  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    
    // 如果删除的是当前对话，清空消息
    if (currentConversationId === conversationId) {
      setMessages([]);
      setCurrentConversationId(null);
    }
    
    // 更新本地存储
    localStorage.setItem(
      'mindmates-conversations', 
      JSON.stringify(conversations.filter(conv => conv.id !== conversationId))
    );
  };
  
  // 从本地存储加载历史对话
  useEffect(() => {
    const savedConversations = localStorage.getItem('mindmates-conversations');
    if (savedConversations) {
      try {
        const parsed = JSON.parse(savedConversations);
        setConversations(parsed);
      } catch (error) {
        console.error('Failed to parse saved conversations:', error);
      }
    }
  }, []);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || selectedModels.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: Date.now(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // 按照设定的顺序为每个选中的模型创建回复
    for (const modelId of modelReplyOrder) {
      const model = selectedModels.find(m => m.id === modelId);
      if (!model) continue;
      // 添加思考状态消息
      const thinkingMessage: Message = {
        id: `thinking-${Date.now()}-${model.id}`,
        content: '正在思考...',
        role: 'assistant',
        modelId: model.id,
        modelName: model.name,
        isThinking: true,
        timestamp: Date.now(),
        status: 'sending',
        displayContent: '正在思考...' // 添加displayContent以保持显示区域一致
      };
      setMessages(prev => [...prev, thinkingMessage]);
      try {
        // 获取当前消息列表，包括之前所有的对话内容
        const currentMessages = messages.concat(userMessage);
        const response = await fetch('http://localhost:3001/api/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model.id,
            messages: [
              { 
                role: 'system', 
                content: `你是${model.name}，一个人工智能助手。请仔细阅读并理解之前的所有对话内容（包括用户和其他助手的发言），然后自然地参与到对话中。你可以对之前的观点进行补充、讨论或提出新的见解。请确保你的回答与对话上下文保持连贯。` 
              },
              ...currentMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
                name: msg.modelName // 添加模型名称以区分不同模型的回复
              }))
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        // 移除思考状态消息
        setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id))

        const assistantMessage: Message = {
          id: `${Date.now()}-${model.id}`,
          content: data.choices[0].message.content,
          role: 'assistant',
          modelId: model.id,
          modelName: model.name,
          displayContent: '',
          timestamp: Date.now(),
          status: 'sent'
        };
        setMessages(prev => [...prev, assistantMessage]);

        // 实现打字机效果
        let displayText = '';
        for (let i = 0; i < assistantMessage.content.length; i++) {
          await new Promise(resolve => setTimeout(resolve, typingSpeed));
          displayText += assistantMessage.content[i];
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessage.id
                ? { ...msg, displayContent: displayText }
                : msg
            )
          );
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage: Message = {
          id: `${Date.now()}-${model.id}`,
          content: '抱歉，发生了一些错误，请稍后再试。',
          role: 'assistant',
          modelId: model.id,
          modelName: model.name,
          timestamp: Date.now(),
          status: 'error'
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  // 处理模型回复顺序变更
  const handleOrderChange = (modelId: string, direction: 'up' | 'down') => {
    const currentIndex = modelReplyOrder.indexOf(modelId);
    if (currentIndex === -1) return;
    
    const newOrder = [...modelReplyOrder];
    if (direction === 'up' && currentIndex > 0) {
      // 上移
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
    } else if (direction === 'down' && currentIndex < newOrder.length - 1) {
      // 下移
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
    }
    
    setModelReplyOrder(newOrder);
  };
  
  // 格式化时间戳
  const formatMessageTime = (timestamp: number) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    // 如果是今天的消息，只显示时间
    if (messageDate.toDateString() === now.toDateString()) {
      return format(messageDate, 'HH:mm');
    }
    
    // 否则显示日期和时间
    return format(messageDate, 'yyyy-MM-dd HH:mm');
  };
  
  // 生成模型排序菜单
  const modelOrderMenu = (
    <Menu>
      {selectedModels.length > 0 && (
        <Menu.ItemGroup title="模型回复顺序">
          {modelReplyOrder.map((modelId, index) => {
            const model = selectedModels.find(m => m.id === modelId);
            if (!model) return null;
            
            return (
              <Menu.Item key={modelId}>
                <div className="model-order-item">
                  <span>{index + 1}. {model.name}</span>
                  <Space>
                    <Button 
                      type="text" 
                      size="small" 
                      disabled={index === 0}
                      onClick={() => handleOrderChange(modelId, 'up')}
                    >
                      ↑
                    </Button>
                    <Button 
                      type="text" 
                      size="small" 
                      disabled={index === modelReplyOrder.length - 1}
                      onClick={() => handleOrderChange(modelId, 'down')}
                    >
                      ↓
                    </Button>
                  </Space>
                </div>
              </Menu.Item>
            );
          })}
        </Menu.ItemGroup>
      )}
    </Menu>
  );

  // 不再需要格式化对话列表中的时间戳
  
  // 处理选择模型
  const handleSelectModel = (modelId: string) => {
    setActiveConversation(modelId);
  };
  
  // 切换侧边栏显示
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="chat-container">
      {/* 左侧功能区 */}
      <div className={`chat-sidebar ${showSidebar ? 'visible' : 'hidden'}`}>
        <div className="sidebar-header">
          <Typography.Title level={4} className="sidebar-title">功能区</Typography.Title>
          <Button 
            type="text" 
            icon={<PlusOutlined />} 
            onClick={createNewConversation}
            className="new-chat-button"
          />
        </div>
        
        {/* 模型选择区域 */}
        <div className="sidebar-section model-selection-section">
          <Typography.Title level={5} className="sidebar-subtitle">选择模型</Typography.Title>
          <div className="model-selection-container">
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="请选择一个或多个模型"
              value={selectedModels.map(model => model.id)}
              onChange={(values) => {
                const selected = availableModels.filter(model => values.includes(model.id));
                onModelsChange(selected);
              }}
              optionLabelProp="label"
              className="model-select"
            >
              {availableModels.map(model => (
                <Select.Option key={model.id} value={model.id} label={model.name}>
                  <div className="model-option">
                    <Avatar size="small" icon={<RobotOutlined />} className="model-option-avatar" />
                    <div className="model-option-info">
                      <div className="model-option-name">{model.name}</div>
                      <div className="model-option-desc">{model.description}</div>
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
            
            {selectedModels.length > 0 && (
              <div className="selected-models-list">
                {selectedModels.map(model => (
                  <Tag 
                    key={model.id} 
                    className="selected-model-tag"
                    closable
                    onClose={() => {
                      onModelsChange(selectedModels.filter(m => m.id !== model.id));
                    }}
                    icon={<RobotOutlined />}
                  >
                    {model.name}
                  </Tag>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        {/* 历史对话列表 */}
        <div className="sidebar-section">
          <Typography.Title level={5} className="sidebar-subtitle">历史对话</Typography.Title>
          <div className="conversation-list">
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>暂无历史对话</p>
                <p>开始新对话并保存，即可在此查看</p>
              </div>
            ) : (
              conversations.map(conversation => (
                <div 
                  key={conversation.id}
                  className={`conversation-item ${currentConversationId === conversation.id ? 'active' : ''}`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <Avatar 
                    size={40} 
                    icon={<MessageOutlined />}
                    className="conversation-avatar"
                  />
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="conversation-name">{conversation.name}</span>
                      <span className="conversation-time">{formatMessageTime(conversation.timestamp)}</span>
                    </div>
                    <div className="conversation-message">
                      {conversation.messages.length > 0 
                        ? conversation.messages[conversation.messages.length - 1].content.substring(0, 30) + (conversation.messages[conversation.messages.length - 1].content.length > 30 ? '...' : '')
                        : '空对话'}
                    </div>
                  </div>
                  <Button 
                    type="text" 
                    size="small" 
                    className="delete-conversation-btn"
                    icon={<DeleteOutlined />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* 右侧聊天区域 */}
      <div className="chat-main">
        {/* 聊天头部 */}
        <div className="chat-header">
          <Button 
            type="text" 
            icon={showSidebar ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={toggleSidebar}
          >
            {showSidebar ? '收起侧边栏' : '展开侧边栏'}
          </Button>
          
          {/* 聊天工具栏 */}
          <div className="chat-toolbar">
            <div className="toolbar-left">
              <Dropdown overlay={modelOrderMenu} trigger={['click']}>
                <Button type="text" size="small">
                  <Space>
                    模型顺序
                    <DownOutlined />
                  </Space>
                </Button>
              </Dropdown>
              <Button 
                type="text" 
                icon={<PlusOutlined />} 
                onClick={createNewConversation}
                size="small"
              >
                新建对话
              </Button>
            </div>
            <div className="toolbar-right">
              <Button 
                type="text" 
                icon={<SaveOutlined />} 
                onClick={saveCurrentConversation}
                size="small"
                disabled={messages.length === 0}
              >
                保存对话
              </Button>
              <Button 
                type="text" 
                icon={<ClearOutlined />} 
                onClick={clearChat}
                size="small"
              >
                清空聊天
              </Button>
            </div>
          </div>
        </div>
        
        {/* 聊天消息区域 */}
        <div className="chat-messages-container">
          {selectedModels.length === 0 ? (
            <div className="empty-chat-placeholder">
              <RobotOutlined className="empty-chat-icon" />
              <p className="empty-chat-text">请在左侧功能区选择一个或多个模型开始对话</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-chat-placeholder">
              <RobotOutlined className="empty-chat-icon" />
              <p className="empty-chat-text">开始新的对话吧！</p>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`message-item ${message.role}`}
              >
                {message.role === 'assistant' && (
                  <Avatar 
                    icon={<RobotOutlined />} 
                    className="assistant-avatar"
                  />
                )}
                
                <div 
                  className={`message-bubble ${
                    message.role === 'user' ? 'user-message-bubble' : 'assistant-message-bubble'
                  }`}
                >
                  {message.isThinking ? (
                    <div className="thinking-indicator">
                      <span>正在思考</span>
                      <span className="thinking-dots"></span>
                    </div>
                  ) : (
                    <div className="message-content">
                      {message.role === 'assistant' && message.displayContent !== undefined
                        ? message.displayContent
                        : message.content}
                    </div>
                  )}
                  
                  <div className="message-meta">
                    <div className="message-time">
                      {message.modelName && (
                        <span className="model-name">{message.modelName}</span>
                      )}
                      <ClockCircleOutlined />
                      <span>{formatMessageTime(message.timestamp)}</span>
                    </div>
                    {message.status === 'error' && (
                      <span className="message-status error">发送失败</span>
                    )}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar 
                    icon={<UserOutlined />} 
                    className="user-avatar"
                  />
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <div className="input-actions">
              <Button 
                type="text" 
                className="input-action-button"
                icon={<SmileOutlined />}
              />
              <Button 
                type="text" 
                className="input-action-button"
                icon={<PaperClipOutlined />}
              />
            </div>
            
            <Input.TextArea
              className="chat-input"
              placeholder="输入消息..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={e => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              autoSize={{ minRows: 1, maxRows: 4 }}
            />
            
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              className="send-button"
              shape="circle"
              disabled={!inputValue.trim() || selectedModels.length === 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
