#!/bin/bash
# 通过 WinSCP/SSH 下载问题统计文件到本地
# 需要配置好 SSH 密码

COMMANDS='
ssh cw@8.136.29.208 "mkdir -p /tmp/bug-report && cd /home/cw/a/community-backend/问题统计测试准备 &&
cp Bug 记录文档.md /tmp/bug-report/ &&
ls -la /tmp/bug-report/ &&
cat /tmp/bug-report/Bug 记录文档.md"
'

set -x
eval "$COMMANDS"
