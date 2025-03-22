import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, List, Avatar, Typography, Tooltip } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClearOutlined } from '@ant-design/icons';
import './Chat.css';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  modelId?: string;
  modelName?: string;
  isThinking?: boolean;
  displayContent?: string;
}

interface ChatProps {
  selectedModels: Array<{
    id: string;
    name: string;
    description: string;
    apiEndpoint: string;
  }>;
}

const Chat: React.FC<ChatProps> = ({ selectedModels }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typingSpeed] = useState(30);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 清空聊天记录
  const clearChat = () => {
    setMessages([]);
  };
  
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
      role: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // 为每个选中的模型创建回复
    for (const model of selectedModels) {
      // 添加思考状态消息
      const thinkingMessage: Message = {
        id: `thinking-${Date.now()}-${model.id}`,
        content: '正在思考...',
        role: 'assistant',
        modelId: model.id,
        modelName: model.name,
        isThinking: true
      };
      setMessages(prev => [...prev, thinkingMessage]);
      try {
        const response = await fetch('http://localhost:3001/api/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model.id,
            messages: [
              { role: 'system', content: '你是人工智能助手.' },
              ...messages.map(msg => ({ role: msg.role, content: msg.content })),
              { role: userMessage.role, content: userMessage.content }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        // 移除思考状态消息
        setMessages(prev => prev.filter(msg => msg.id !== `thinking-${Date.now()}-${model.id}`))

        const assistantMessage: Message = {
          id: `${Date.now()}-${model.id}`,
          content: data.choices[0].message.content,
          role: 'assistant',
          modelId: model.id,
          modelName: model.name,
          displayContent: ''
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
          modelName: model.name
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Tooltip title="清空聊天记录">
          <Button 
            type="text" 
            icon={<ClearOutlined />} 
            onClick={clearChat}
            disabled={messages.length === 0}
          />
        </Tooltip>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', minHeight: 0 }} className="chat-messages">
        <List
          dataSource={messages}
          renderItem={message => (
            <List.Item style={{
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              padding: '8px 0'
            }}>
              {message.role === 'assistant' && (
                <Avatar
                  size={36}
                  icon={<RobotOutlined />}
                  style={{ 
                    backgroundColor: '#6b7ff7', 
                    boxShadow: '0 2px 4px rgba(107, 127, 247, 0.2)',
                    marginRight: '8px',
                    flexShrink: 0
                  }}
                />
              )}
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: message.role === 'user' 
                  ? '18px 18px 4px 18px' 
                  : '18px 18px 18px 4px',
                background: message.role === 'user' ? '#1890ff' : '#f5f5f5',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                color: message.role === 'user' ? '#fff' : '#333',
                position: 'relative'
              }}>
                {message.role === 'assistant' && message.modelName && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '-18px', 
                    left: '0', 
                    fontSize: '12px', 
                    color: '#666',
                    fontWeight: 500
                  }}>
                    {message.modelName}
                  </div>
                )}
                <div style={{
                  fontSize: '15px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {message.isThinking ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{message.content}</span>
                      <span className="thinking-dots"></span>
                    </div>
                  ) : (
                    message.displayContent || message.content
                  )}
                </div>
              </div>
              {message.role === 'user' && (
                <Avatar
                  size={36}
                  icon={<UserOutlined />}
                  style={{ 
                    backgroundColor: '#1890ff', 
                    boxShadow: '0 2px 4px rgba(24, 144, 255, 0.2)',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}
                />
              )}
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>
      <div style={{ 
        padding: '16px 20px', 
        borderTop: '1px solid #f0f0f0',
        background: '#fafafa',
        borderRadius: '0 0 16px 16px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          gap: '12px',
          position: 'relative'
        }}>
          <Input.TextArea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={selectedModels.length > 0 ? "请输入消息..." : "请先选择一个模型开始对话"}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ 
              padding: '12px 16px',
              borderRadius: '18px',
              resize: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              flex: 1
            }}
            disabled={selectedModels.length === 0}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Tooltip title="发送消息 (Enter)">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!inputValue.trim() || selectedModels.length === 0}
              style={{ 
                boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                marginBottom: '4px'
              }}
            />
          </Tooltip>
        </div>
        {selectedModels.length > 0 && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: '#888',
            textAlign: 'center' 
          }}>
            按 Enter 发送，Shift + Enter 换行
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;