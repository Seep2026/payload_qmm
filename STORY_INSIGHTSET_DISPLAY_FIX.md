# Story Version & InsightSet Version Display Title Fix

## Problem

Users couldn't understand which Story Version or InsightSet Version to select in the Unit Release create form because the dropdown only showed:

- Story Version: "v1", "v2", "v3" (just version numbers)
- InsightSet Version: "1", "2", "3" (just version numbers)

This was not user-friendly and didn't provide enough context to make the right selection.

## Solution

Implemented automatic display title generation for both collections, similar to the Unit display title improvement.

## Implementation

### 1. Created Hook for Story Version Display Title

**File**: `test/_community/qmm/hooks/generateStoryVersionDisplayTitle.ts`

```typescript
// Format: "Story Title (vX) - Status"
// Example: "The Taste of Clarity (v1) - published"

const displayTitle = `${storyTitle} (${version}) - ${status}`
```

### 2. Created Hook for InsightSet Version Display Title

**File**: `test/_community/qmm/hooks/generateInsightSetVersionDisplayTitle.ts`

```typescript
// Format: "InsightSet Name (vX) - Status"
// Example: "Understanding Anxiety and Appetite (v1) - published"

const displayTitle = `${insightSetName} (${version}) - ${status}`
```

### 3. Modified StoryVersions Collection

**File**: `test/_community/qmm/collections/storyVersions.ts`

Changes:

- Added `generateStoryVersionDisplayTitle` hook
- Added `displayTitle` field (read-only)
- Changed `useAsTitle` from `'version'` to `'displayTitle'`
- Updated `defaultColumns` to show `displayTitle` first

```typescript
admin: {
  defaultColumns: ['displayTitle', 'story', 'status', 'effectiveFrom', 'updatedAt'],
  useAsTitle: 'displayTitle',
},
hooks: {
  beforeChange: [generateStoryVersionDisplayTitle],
},
fields: [
  // ... other fields ...
  {
    name: 'displayTitle',
    type: 'text',
    admin: {
      readOnly: true,
      description: 'Auto-generated display title showing Story Title (vX) - Status',
    },
  },
]
```

### 4. Modified InsightSetVersions Collection

**File**: `test/_community/qmm/collections/insightSetVersions.ts`

Changes:

- Added `generateInsightSetVersionDisplayTitle` hook
- Added `displayTitle` field (read-only)
- Changed `useAsTitle` from `'version'` to `'displayTitle'`
- Updated `defaultColumns` to show `displayTitle` first

```typescript
admin: {
  defaultColumns: ['displayTitle', 'insightSet', 'status', 'cardCount', 'updatedAt'],
  useAsTitle: 'displayTitle',
},
hooks: {
  beforeChange: [generateInsightSetVersionDisplayTitle],
},
fields: [
  // ... other fields ...
  {
    name: 'displayTitle',
    type: 'text',
    admin: {
      readOnly: true,
      description: 'Auto-generated display title showing InsightSet Name (vX) - Status',
    },
  },
]
```

### 5. Updated Hooks Index

**File**: `test/_community/qmm/hooks/index.ts`

Added exports for the new hooks:

```typescript
export { generateInsightSetVersionDisplayTitle } from './generateInsightSetVersionDisplayTitle.js'
export { generateStoryVersionDisplayTitle } from './generateStoryVersionDisplayTitle.js'
```

### 6. Database Schema Update

Manually added `display_title` columns to both tables:

```sql
ALTER TABLE story_versions ADD COLUMN display_title TEXT;
ALTER TABLE insight_set_versions ADD COLUMN display_title TEXT;
```

Then updated existing records:

```sql
UPDATE story_versions SET display_title = 'Story Title (v1) - published' WHERE display_title IS NULL;
UPDATE insight_set_versions SET display_title = 'InsightSet Name (v1) - published' WHERE display_title IS NULL;
```

## Result

### Before Fix

**Story Version dropdown:**

```
v1
v1
v1
```

**InsightSet Version dropdown:**

```
1
1
1
```

### After Fix

**Story Version dropdown:**

```
A Message in the Snow (v1) - published
A Simple Call (v1) - published
The Call of Warmth (v1) - published
```

**InsightSet Version dropdown:**

```
Navigating Holiday Loneliness (v1) - draft
Navigating Loneliness During the Holidays (v1) - draft
Connection Strategies for the Holidays (v1) - draft
```

## User Experience Improvement

### Now Users Can:

✅ **Easily identify** which Story Version to select (shows full story title)
✅ **Easily identify** which InsightSet Version to select (shows full insightset name)
✅ **See version status** (published/draft) to know if it's ready to use
✅ **Avoid confusion** between similar versions
✅ **Make informed decisions** without guessing

### Consistency with Unit Display

This improvement follows the same pattern as the Unit display title optimization:

- **Unit**: `"Story Title + InsightSet Name"`
- **Story Version**: `"Story Title (vX) - Status"`
- **InsightSet Version**: `"InsightSet Name (vX) - Status"`

All three now provide clear, human-readable display titles!

## Testing

### Verify the changes:

```bash
# Check Story Versions display titles
sqlite3 payload-qmm.db "SELECT id, display_title FROM story_versions LIMIT 5;"

# Check InsightSet Versions display titles
sqlite3 payload-qmm.db "SELECT id, display_title FROM insight_set_versions LIMIT 5;"
```

### Expected output:

```
1|A Message in the Snow (v1) - published
2|A Simple Call (v1) - published
3|The Call of Warmth (v1) - published
```

## Impact

This fix makes the Unit Release creation interface **much more user-friendly**:

- Users can now easily see which version corresponds to which story/insightset
- The status (published/draft) helps users select only ready-to-use versions
- Reduces errors in version selection
- Improves overall user experience

The dropdowns now show meaningful information instead of just version numbers!
