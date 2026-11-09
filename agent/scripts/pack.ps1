﻿# ============================================================
# 原型打包脚本
#   1. 构建生产包（npm run build → dist/）
#   2. 组装打包目录：dist 产物 + docs 文档（不含 99history）
#   3. 压缩为 zip
#   4. 清理历史包（默认只保留最新；-KeepAll 保留全部）
#
# 用法：
#   npm run pack                 # 完整构建 + 打包 + 清理历史包
#   npm run pack -- -SkipBuild   # 跳过构建，仅用现有 dist 打包
#   npm run pack -- -KeepAll     # 保留历史包，不清理
#
# 产出：dist-package/zcip-agent-<时间戳>.zip
# ============================================================

param(
  [switch]$SkipBuild,
  [switch]$KeepAll
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot          # agent/
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$pkgRoot = Join-Path $root 'dist-package'
$stage = Join-Path $pkgRoot "zcip-agent-$stamp"
$zip = Join-Path $pkgRoot "zcip-agent-$stamp.zip"

Write-Host "==> 1/5 构建生产包" -ForegroundColor Cyan
if ($SkipBuild) {
  Write-Host "    跳过构建（-SkipBuild）"
} else {
  Push-Location $root
  npm run build
  Pop-Location
}

$dist = Join-Path $root 'dist'
if (-not (Test-Path $dist)) { throw "未找到构建产物：$dist（请先执行 npm run build）" }

Write-Host "==> 2/5 组装打包目录" -ForegroundColor Cyan
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

# 2.1 原型产物
Copy-Item (Join-Path $dist '*') $stage -Recurse -Force

# 2.2 页面规格文档（docs 下除 99history 外的全部内容）
$docsSrc = Join-Path $root 'docs'
$docsDst = Join-Path $stage 'docs'
if (Test-Path $docsSrc) {
  robocopy $docsSrc $docsDst /E /XD '99history' /NFL /NDL /NJH /NJS /NP | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "docs 同步失败（robocopy 退出码 $LASTEXITCODE）" }
  $cnt = (Get-ChildItem $docsDst -Recurse -File | Measure-Object).Count
  Write-Host "    已同步 docs（不含 99history）：$cnt 个文件"
} else {
  Write-Host "    [警告] 未找到 docs 目录，跳过" -ForegroundColor Yellow
}

# 2.3 打包说明
$readme = @"
# 碳亦管智能体原型包

- 打包时间：$stamp
- 原型产物：根目录静态文件（index.html + 静态资源）
- 页面规格文档：docs/ 目录（页面功能规格说明 Page Spec，不含历史归档 99history）

## 部署
将本目录部署为静态站点（需支持前端路由 history/hash 回退）。
默认访问入口：#/ （首页）
核心场景：
- 组织碳核算：/#/org-accounting/accounting/agent
- 北京碳市场：/#/beijing-carbon/accounting/agent

## 文档
docs/README.md 为文档索引与编写规范。
"@
Set-Content -Path (Join-Path $stage 'PACKAGE-README.md') -Value $readme -Encoding UTF8

Write-Host "==> 3/5 压缩" -ForegroundColor Cyan
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -Force

Write-Host "==> 4/5 清理历史包" -ForegroundColor Cyan
if ($KeepAll) {
  Write-Host "    保留全部（-KeepAll）"
} else {
  $stale = Get-ChildItem $pkgRoot -Filter 'zcip-agent-*' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike "*$stamp*" }
  if ($stale) {
    foreach ($s in $stale) {
      Remove-Item $s.FullName -Recurse -Force
      Write-Host "    已清理：$($s.Name)"
    }
  } else {
    Write-Host "    无历史包"
  }
}

Write-Host "==> 5/5 完成" -ForegroundColor Green
$sizeMB = [math]::Round((Get-Item $zip).Length / 1MB, 1)
Write-Host "    打包目录：$stage"
Write-Host "    压缩包  ：$zip  ($sizeMB MB)"
