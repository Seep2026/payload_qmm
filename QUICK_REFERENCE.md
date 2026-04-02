# Unit Release 快速参考

## 🎯 核心概念

```
Theme (主题)  ← 从这里开始
  ↓
Story (故事) ← 1 Theme = 1 Story
  ↓
InsightSet (洞察集) ← 1 Theme = 1 InsightSet
  ↓
Versions (版本) ← 自动选择最新的 published 版本
```

## ⚡ 快速创建（3步）

### 步骤 1: 选择 Theme

- 在 "Quick Unit Release Creator" 区域
- 选择下拉菜单中的一个 Theme

### 步骤 2: 点击 Auto-Fill Form

- 系统自动填充所有版本字段
- 预览区域显示 ✅ 绿色确认

### 步骤 3: 配置并保存

- Status: 选择 `active` 或 `scheduled`
- Start At: 设置开始时间
- Priority: 设置优先级（默认 0）
- 点击 Save

## 📋 字段说明

| 字段                   | 作用                     | 如何选择                                        |
| ---------------------- | ------------------------ | ----------------------------------------------- |
| **Theme**              | 主题                     | 从下拉菜单选择                                  |
| **Unit**               | 连接 Story 和 InsightSet | 自动填充                                        |
| **Story Version**      | 要发布的 Story 版本      | 自动填充（显示：Story Title (vX) - Status）     |
| **InsightSet Version** | 要发布的 InsightSet 版本 | 自动填充（显示：InsightSet Name (vX) - Status） |
| **Status**             | 发布状态                 | 手动选择：active / scheduled                    |
| **Start At**           | 开始时间                 | 手动设置日期时间                                |
| **Priority**           | 优先级                   | 手动设置（数字越大优先级越高）                  |

## 🔍 版本选择指南

### Story Version 格式

```
✅ Story Title
Version: v1 | Status: published
```

**应选择**：Status 为 `published` 的版本

### InsightSet Version 格式

```
✅ InsightSet Name
Version: v1 | Status: published
```

**应选择**：Status 为 `published` 的版本

## ❓ 常见问题

**Q: 应该选哪个版本？**
A: 使用 "Auto-Fill Form"，系统自动选择正确的版本

**Q: v1, v2, v3 有什么区别？**
A: v1 = 版本1, v2 = 版本2（更高版本通常更新）

**Q: published 和 draft 有什么区别？**
A: published = 已发布可用, draft = 草稿不可用

**Q: 为什么保存失败？**
A: 检查所有项目是否都是 ✅ 绿色，确保版本状态为 published

## 📞 需要帮助？

- 详细指南：`USER_GUIDE.md`
- 技术文档：`UNIT_RELEASE_SOLUTION.md`
- 快速启动：`QUICK_START.md`

---

**记住**：只选 Theme，点击 Auto-Fill，配置时间，保存完成！
