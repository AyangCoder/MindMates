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

// 检查前端服务
async function checkFrontendService() {
  // 检查常用前端端口
  const frontendPorts = [3000, 3001, 3002, 5173];
  let runningPort = null;
  
  for (const port of frontendPorts) {
    if (await isPortInUse(port)) {
      console.log(`发现前端服务正在运行，端口: ${port}`);
      runningPort = port;
      break;
    }
  }
  
  return runningPort;
}

// 检查后端服务
async function checkBackendService() {
  // 检查常用后端端口
  const backendPorts = [3001, 5173];
  let runningPort = null;
  
  for (const port of backendPorts) {
    if (await isPortInUse(port)) {
      console.log(`发现后端服务正在运行，端口: ${port}`);
      runningPort = port;
      break;
    }
  }
  
  return runningPort;
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
  const command = args[0]; // 'start', 'stop', 'restart'
  
  if (!command) {
    console.log('使用方法: node start.js <start|stop|restart> [frontend|backend]');
    console.log('例如: node start.js start frontend - 启动前端服务');
    console.log('例如: node start.js start backend - 启动后端服务');
    console.log('例如: node start.js start - 启动前后端服务');
    return;
  }
  
  if (command === 'start') {
    const serviceType = args[1]; // 'frontend', 'backend' 或 undefined (表示两者都启动)
    
    // 检查前端服务
    const frontendRunning = await checkFrontendService();
    
    // 检查后端服务
    const backendRunning = await checkBackendService();
    
    // 根据参数启动相应服务
    if (!serviceType || serviceType === 'frontend') {
      if (frontendRunning) {
        console.log(`前端服务已在端口 ${frontendRunning} 运行，无需重复启动。`);
      } else {
        await startService('frontend', 3000);
      }
    }
    
    if (!serviceType || serviceType === 'backend') {
      if (backendRunning) {
        console.log(`后端服务已在端口 ${backendRunning} 运行，无需重复启动。`);
      } else {
        await startService('backend', 3001);
      }
    }
  } else {
    console.log(`不支持的命令: ${command}`);
    console.log('使用方法: node start.js <start|stop|restart> [frontend|backend]');
  }
}

main().catch(console.error);