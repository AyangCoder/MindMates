#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

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

// 停止指定端口的服务
async function stopService(port) {
  try {
    // 检查端口是否被占用
    const portInUse = await isPortInUse(port);
    
    if (!portInUse) {
      console.log(`端口 ${port} 没有服务在运行。`);
      return;
    }
    
    console.log(`正在停止端口 ${port} 的服务...`);
    
    // 获取进程ID
    const { stdout } = await execAsync(`lsof -i:${port} -t`);
    const pids = stdout.trim().split('\n');
    
    // 停止进程
    for (const pid of pids) {
      if (pid) {
        console.log(`正在停止进程 ${pid}...`);
        await execAsync(`kill ${pid}`);
        console.log(`进程 ${pid} 已停止。`);
      }
    }
    
    console.log(`端口 ${port} 的服务已停止。`);
  } catch (error) {
    console.error(`停止服务时出错:`, error);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const port = args[0]; // 端口号
  
  if (!port) {
    console.log('使用方法: node stop-service.js <port>');
    console.log('例如: node stop-service.js 3000');
    return;
  }
  
  await stopService(port);
}

main().catch(console.error);