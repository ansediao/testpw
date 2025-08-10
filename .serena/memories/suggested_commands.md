# PW Canvas 建议命令

## Windows 系统常用命令

### 文件和目录操作
```powershell
# 列出目录内容
Get-ChildItem
dir
ls  # 如果安装了 PowerShell Core

# 切换目录
Set-Location "path\to\directory"
cd "path\to\directory"

# 创建目录
New-Item -ItemType Directory -Name "folder_name"
mkdir "folder_name"

# 创建文件
New-Item -ItemType File -Name "filename.ext"

# 复制文件
Copy-Item "source" "destination"

# 移动文件
Move-Item "source" "destination"

# 删除文件
Remove-Item "filename"

# 查找文件
Get-ChildItem -Recurse -Name "*.php"
```

### 文本搜索和处理
```powershell
# 在文件中搜索文本
Select-String "search_pattern" "filename"
Select-String "search_pattern" *.php

# 递归搜索
Get-ChildItem -Recurse *.php | Select-String "search_pattern"

# 查看文件内容
Get-Content "filename"
cat "filename"  # 如果安装了别名

# 查看文件前几行
Get-Content "filename" -Head 10

# 查看文件尾部
Get-Content "filename" -Tail 10
```

## Git 版本控制
```bash
# 查看状态
git status

# 添加文件
git add .
git add "specific_file.php"

# 提交更改
git commit -m "commit message"

# 推送到远程
git push origin main

# 拉取最新代码
git pull origin main

# 查看提交历史
git log --oneline -10

# 创建分支
git checkout -b "feature/new-feature"

# 切换分支
git checkout "branch_name"

# 查看分支
git branch -a
```

## WordPress 开发相关

### 插件开发
```powershell
# 激活插件（通过 WP-CLI，如果安装）
wp plugin activate pw-admin

# 停用插件
wp plugin deactivate pw-admin

# 查看插件状态
wp plugin status

# 清除缓存
wp cache flush
```

### 数据库操作（通过 WP-CLI）
```powershell
# 导出数据库
wp db export backup.sql

# 导入数据库
wp db import backup.sql

# 搜索替换 URL
wp search-replace "old-url.com" "new-url.com"
```

## 开发调试

### PHP 调试
```powershell
# 查看 PHP 错误日志（需要知道日志位置）
Get-Content "C:\path\to\php\error.log" -Tail 20

# 检查 PHP 语法
php -l "filename.php"
```

### 前端调试
```powershell
# 启动本地服务器（如果需要）
php -S localhost:8000

# 使用 Node.js 工具（如果安装）
npm install
npm run dev
npm run build
```

## 文件权限和安全
```powershell
# 查看文件属性
Get-ItemProperty "filename"

# 设置文件只读
Set-ItemProperty "filename" -Name IsReadOnly -Value $true

# 移除只读属性
Set-ItemProperty "filename" -Name IsReadOnly -Value $false
```

## 项目特定命令

### 开发环境设置
```powershell
# 进入项目目录
cd "d:\PW CANVAS\canvas"

# 检查项目结构
Get-ChildItem -Recurse -Directory | Select-Object Name, FullName

# 查找特定文件类型
Get-ChildItem -Recurse -Include "*.php", "*.js", "*.css"
```

### 代码质量检查
```powershell
# 查找 PHP 语法错误
Get-ChildItem -Recurse -Include "*.php" | ForEach-Object { php -l $_.FullName }

# 搜索 TODO 注释
Select-String "TODO" -Include "*.php", "*.js" -Recurse

# 搜索调试代码
Select-String "console.log\|var_dump\|print_r" -Include "*.php", "*.js" -Recurse
```

### 备份和部署
```powershell
# 创建项目备份
Compress-Archive -Path ".\*" -DestinationPath "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"

# 排除特定文件的备份
$exclude = @('*.log', '.git', 'node_modules')
Get-ChildItem -Exclude $exclude | Compress-Archive -DestinationPath "backup.zip"
```

## 性能监控
```powershell
# 监控文件变化（需要 PowerShell 5.0+）
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "."
$watcher.Filter = "*.php"
$watcher.EnableRaisingEvents = $true
```

## 注意事项
- Windows 路径使用反斜杠 `\` 或在 PowerShell 中使用正斜杠 `/`
- 某些命令需要管理员权限
- 建议使用 PowerShell 而不是 CMD
- 如果安装了 Git Bash 或 WSL，可以使用 Unix 风格的命令