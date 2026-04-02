# Bug Fix Summary: InsightSet Version Mismatch

## Problem

When creating a Unit Release using the Quick Creator, users encountered the error:

```
InsightSet version mismatch: Unit is linked to InsightSet "2", but selected InsightSet Version belongs to a different InsightSet.
```

## Root Cause

In `UnitReleaseAutoCreator.tsx`, there were two critical bugs on lines 64 and 93:

**Line 64 (Bug):**

```typescript
const insightSet = insightSetsResponse.docs?.[0]
```

**Line 93 (Bug):**

```typescript
insightSetVersion = insightSetVersionsResponse.docs?.[0]
```

### Issue

The code was trying to access the `docs` property directly on the **Fetch Response object** instead of the **parsed JSON data object**.

This caused:

1. `insightSet` to be `undefined` (because `insightSetsResponse.docs` doesn't exist)
2. `insightSetVersion` to be `undefined` (because `insightSetsResponse.docs` doesn't exist)
3. The subsequent queries to fetch versions failed or returned incorrect data
4. The `enforceUnitReleaseConsistency` hook correctly detected the mismatch and threw an error

## Fix Applied

**Line 64 (Fixed):**

```typescript
const insightSet = insightSetsData.docs?.[0]
```

**Line 93 (Fixed):**

```typescript
insightSetVersion = insightSetVersionsData.docs?.[0]
```

### Changes Made

- Use `insightSetsData` (parsed JSON) instead of `insightSetsResponse` (Fetch Response)
- Use `insightSetVersionsData` (parsed JSON) instead of `insightSetVersionsResponse` (Fetch Response)

## Verification

The fix ensures that:

1. `insightSet` is correctly retrieved from the parsed response data
2. `insightSetVersion` is correctly retrieved from the parsed response data
3. The versions match the corresponding Story and InsightSet
4. The `enforceUnitReleaseConsistency` hook validation passes

## Files Modified

- `app/(payload)/admin/components/UnitReleaseAutoCreator.tsx` (lines 64 and 93)

## How to Test

1. Start the service: `PAYLOAD_DATABASE=sqlite SQLITE_URL=file:./payload-qmm.db PAYLOAD_DROP_DATABASE=false pnpm dev _community`
2. Navigate to: `/admin/collections/unit-releases/create`
3. Select a Theme from the "Quick Unit Release Creator"
4. Click "Auto-Fill Form"
5. Configure the release schedule
6. Save
7. The Unit Release should be created successfully without errors
