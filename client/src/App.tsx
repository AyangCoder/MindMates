import React, { useState } from 'react';
import { Layout, Card, Avatar, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface Model {
  id: string;
  name: string;
  description: string;
  apiEndpoint: string;
}

const models: Model[] = [
  {
    id: 'ep-20250215230853-ndhsj',
    name: '豆包-1.5Pro-32k',
    description: '强大的中文大语言模型',
    apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
  },
  {
    id: 'ep-20250215234034-fc2h9',
    name: 'DeepSeek R1',
    description: '专业的推理模型',
    apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
  }
];

const App: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px' }}>
        <Title level={3} style={{ margin: '16px 0' }}>MindMates - 思维伙伴</Title>
      </Header>
      <Layout>
        <Sider width={300} style={{ background: '#fff', padding: '24px' }}>
          <Title level={4}>选择模型</Title>
          {models.map(model => (
            <Card
              key={model.id}
              hoverable
              style={{
                marginBottom: 16,
                borderColor: selectedModel?.id === model.id ? '#1890ff' : '#e8e8e8'
              }}
              onClick={() => setSelectedModel(model)}
            >
              <Card.Meta
                avatar={<Avatar icon={<RobotOutlined />} />}
                title={model.name}
                description={model.description}
              />
            </Card>
          ))}
        </Sider>
        <Content style={{ padding: '24px', background: '#fff', margin: '0 24px' }}>
          {selectedModel ? (
            <div>开始与 {selectedModel.name} 对话</div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20%' }}>
              <Title level={4}>请先选择一个模型开始对话</Title>
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;