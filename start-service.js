#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

// 检查端口是否被占用
async function isPortInUse(port) {
  try {
    const { stdout } = await execAsync(`lsof -i:${port} -t`);
    return stdout.trim().length > 0;
  } catch (error) {
    return false; // 如果命令执行出错，通常意味着端口未被占用
  }
}

// 启动服务
async function startService(type, port) {
  const isBackend = type === 'backend';
  const directory = isBackend ? 'server' : 'client';
  const serviceName = isBackend ? '后端' : '前端';
  
  try {
    // 检查端口是否被占用
    const portInUse = await isPortInUse(port);
    
    if (portInUse) {
      console.log(`端口 ${port} 已被占用，${serviceName}服务可能已经在运行。`);
      return;
    }
    
    // 启动服务
    console.log(`正在启动${serviceName}服务，端口: ${port}...`);
    
    // 使用子进程启动服务
    const cwd = join(process.cwd(), directory);
    const child = exec('npm run dev', { cwd });
    
    child.stdout.on('data', (data) => {
      console.log(`${serviceName}输出: ${data}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`${serviceName}错误: ${data}`);
    });
    
    child.on('close', (code) => {
      console.log(`${serviceName}进程退出，退出码: ${code}`);
    });
    
    console.log(`${serviceName}服务启动命令已执行。`);
  } catch (error) {
    console.error(`启动${serviceName}服务时出错:`, error);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const serviceType = args[0]; // 'frontend' 或 'backend'
  const port = args[1]; // 端口号
  
  if (!serviceType || !port) {
    console.log('使用方法: node start-service.js <frontend|backend> <port>');
    console.log('例如: node start-service.js frontend 3000');
    console.log('例如: node start-service.js backend 3001');
    return;
  }
  
  if (serviceType !== 'frontend' && serviceType !== 'backend') {
    console.log('服务类型必须是 frontend 或 backend');
    return;
  }
  
  await startService(serviceType, port);
}

main().catch(console.error);