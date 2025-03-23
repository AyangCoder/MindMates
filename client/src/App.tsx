import React, { useState } from 'react';
import { Layout, Typography } from 'antd';
import './App.css';
import Chat from './components/Chat';

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
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);

  return (
    <div className="app-container">
    <Layout>
      <Header>
        <Title level={3} style={{ margin: '16px 0', color: '#444', fontWeight: 600 }}>MindMates - 思维伙伴</Title>
      </Header>
      <Layout>
        <Content style={{ display: 'flex', flexDirection: 'column' }}>
          <Chat 
            selectedModels={selectedModels} 
            availableModels={models} 
            onModelsChange={setSelectedModels} 
          />
        </Content>
      </Layout>
    </Layout>
    </div>
  );
};

export default App;