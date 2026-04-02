# Unit Release 用户指南

## 🎯 概述

本文档帮助您理解如何使用 Unit Release 创建界面，特别是 Story Version 和 Insight Set Version 两个字段。

## 📋 数据关系理解

### 数据结构（1:1:1 关系）

```
Theme (主题)
  ↓
Story (故事文章) ← 每个 Theme 对应 1 个 Story
  ↓
InsightSet (洞察集) ← 每个 Theme 对应 1 个 InsightSet
  ↓
Insight Cards (洞察卡片) ← 每个 InsightSet 包含多个 Cards
```

### Unit Release 的作用

Unit Release 是连接 Story 和 InsightSet 的**发布单元**，用于控制哪些内容在网站上显示。

```
Unit Release
  ├── Unit (关联 Story 和 InsightSet)
  ├── Story Version (要发布的 Story 版本)
  ├── InsightSet Version (要发布的 InsightSet 版本)
  └── 发布配置 (时间、状态、优先级等)
```

## 🎨 创建界面说明

### 快速创建器（Quick Unit Release Creator）

位于表单顶部的蓝色区域，是**推荐的创建方式**。

#### 使用步骤：

1. **选择 Theme**

   - 从下拉菜单选择一个主题
   - 系统自动查找所有关联记录

2. **查看预览**

   - 显示所有关联关系的查找结果
   - ✅ 绿色 = 找到对应记录
   - ❌ 红色 = 缺失必要数据
   - ⚠️ 橙色 = 将自动创建

3. **点击 "Auto-Fill Form"**
   - 自动填充所有版本字段
   - 无需手动选择

#### 预览信息说明

**Story Version 显示内容：**

```
✅ Story 标题
Version: v1 | Status: published
```

**InsightSet Version 显示内容：**

```
✅ InsightSet 名称
Version: v1 | Status: published
```

### 标准表单字段

如果需要在 "Auto-Fill Form" 后手动调整，以下是各个字段的说明：

#### Unit

- **作用**：关联 Story 和 InsightSet 的单元
- **如何选择**：无需手动选择，由系统自动填充
- **显示格式**：`Story Title + InsightSet Name`

#### Story Version

- **作用**：要发布的 Story 版本
- **如何选择**：
  - **推荐**：使用 "Auto-Fill Form" 自动选择
  - **手动选择**：如果需要手动选择，下拉菜单显示格式为：
    ```
    Story Title (vX) - Status
    ```
    例如：`"The Taste of Clarity (v1) - published"`
- **说明**：
  - `vX` = 版本号（v1, v2, v3...）
  - `Status` = 状态（draft, review, published, retired）
  - **应选择**：状态为 `published` 的版本

#### Insight Set Version

- **作用**：要发布的 InsightSet 版本（包含所有洞察卡片）
- **如何选择**：
  - **推荐**：使用 "Auto-Fill Form" 自动选择
  - **手动选择**：如果需要手动选择，下拉菜单显示格式为：
    ```
    InsightSet Name (vX) - Status
    ```
    例如：`"Understanding Anxiety and Appetite (v1) - published"`
- **说明**：
  - `vX` = 版本号（v1, v2, v3...）
  - `Status` = 状态（draft, review, published, retired）
  - **应选择**：状态为 `published` 的版本

#### Status（状态）

- **scheduled** = 已安排（未到开始时间）
- **active** = 活跃中（正在展示）
- **paused** = 已暂停（暂时不展示）
- **ended** = 已结束（超过结束时间）

#### Start At（开始时间）

- 发布时间窗口的开始时间
- 使用日期时间选择器设置
- 必须为当前时间或未来时间

#### Priority（优先级）

- 数值越高，优先级越高（0-999）
- 当多个 Unit Release 活跃时，优先级高的优先展示

## ✅ 最佳实践

### 推荐流程

1. **始终使用 Quick Creator**

   - 在页面顶部选择 Theme
   - 点击 "Auto-Fill Form"
   - 无需手动选择版本

2. **验证预览信息**

   - 确保所有项目显示 ✅ 绿色
   - 如果显示 ❌ 红色，说明数据不完整，需要补充

3. **配置发布参数**

   - 设置 Status 为 `active` 或 `scheduled`
   - 设置合适的 Start At 时间
   - 设置 Priority 优先级

4. **保存前检查**
   - 确认 Unit 显示正确的组合标题
   - 确认 Story Version 和 InsightSet Version 显示正确的标题和版本号

### 常见问题

#### Q1: 为什么 "Auto-Fill Form" 按钮是灰色的？

**A**: 没有选择 Theme，或者预览中包含 ❌ 红色项目（缺失数据）

#### Q2: 应该选择哪个 Story Version？

**A**:

- **推荐**：让系统自动选择（使用 "Auto-Fill Form"）
- **手动**：选择状态为 `published` 的最新版本（版本号最高）

#### Q3: 应该选择哪个 InsightSet Version？

**A**:

- **推荐**：让系统自动选择（使用 "Auto-Fill Form"）
- **手动**：选择状态为 `published` 的最新版本（版本号最高）

#### Q4: 为什么保存时提示 "InsightSet version mismatch"？

**A**: 选择的 InsightSet Version 不属于该 Unit 关联的 InsightSet。使用 "Auto-Fill Form" 可避免此错误。

#### Q5: 为什么保存时提示 "Story version does not belong to the same story"？

**A**: 选择的 Story Version 不属于该 Unit 关联的 Story。使用 "Auto-Fill Form" 可避免此错误。

## 🛠️ 故障排查

### 错误："Cannot auto-fill: Missing required relationships"

**原因**：缺少必要的数据关联

**解决方法**：

1. 检查 Theme 是否关联了 Story
   ```bash
   sqlite3 payload-qmm.db "SELECT * FROM stories WHERE theme_id = THEME_ID;"
   ```
2. 检查 Theme 是否关联了 InsightSet
   ```bash
   sqlite3 payload-qmm.db "SELECT * FROM insight_sets WHERE theme_id = THEME_ID;"
   ```
3. 如果缺少数据，通过接口创建关联

### 错误："No such column: display_title"

**原因**：数据库表结构未同步

**解决方法**：

```bash
# 手动添加列
sqlite3 payload-qmm.db "ALTER TABLE insight_story_units ADD COLUMN display_title TEXT;"
```

## 📖 总结

**记住关键点：**

1. **数据关系**：1 Theme = 1 Story = 1 InsightSet
2. **创建流程**：选 Theme → Auto-Fill → 配置时间 → 保存
3. **版本选择**：系统自动选择最新的 published 版本
4. **避免手动选择**：使用 "Auto-Fill Form" 减少错误
5. **验证预览**：确保所有项目都是 ✅ 绿色

## 🎉 完成

现在你已经理解了 Unit Release 的创建流程和数据关系！

详细技术文档请查看：`UNIT_RELEASE_SOLUTION.md`
快速启动指南请查看：`QUICK_START.md`
