# 🛠️ Development Mode Guide

## Anti-Cheat System in Development

The anti-cheat system is **automatically disabled** in development mode to allow for debugging and testing.

---

## What's Different in Dev Mode

### ✅ Disabled Features

1. **DevTools Detection** - You can freely use browser DevTools
2. **Anti-Debug** - Debugger breakpoints work normally
3. **Tampering Detection** - React DevTools and other dev extensions allowed
4. **Security Reporting** - No 404 errors, events logged to console instead
5. **Heartbeat Validation** - Skipped (requires backend)
6. **Request Interceptors** - Nonce/timestamp not added

### 🔍 What You'll See

```
[Dev] Security: Development mode - protections relaxed
[Dev] Anti-debug disabled in development mode
[Dev] Security event: devtools_opened
```

These messages are **normal and expected** in dev mode.

---

## Production vs Development

| Feature | Development | Production |
|---------|------------|------------|
| DevTools Detection | ❌ Disabled | ✅ Active |
| Anti-Debug | ❌ Disabled | ✅ Active |
| Security Logging | 📝 Console only | 📤 Server API |
| Heartbeat | ❌ Skipped | ✅ Every 30s |
| Process Monitoring | ❌ Disabled | ✅ Active (Electron) |
| Request Protection | ❌ Disabled | ✅ Nonce + Timestamp |

---

## Common Dev Mode Messages

### Normal Messages (Ignore These)

```
✅ "[Dev] Security: Development mode - protections relaxed"
✅ "[Dev] Anti-debug disabled in development mode"  
✅ "[Dev] Security event: devtools_opened"
✅ "ReferenceError: dragEvent is not defined" (from dependencies)
```

### Actual Errors (Fix These)

```
❌ "Cannot connect to backend"
❌ "Database connection failed"
❌ "Module not found"
```

---

## Testing Anti-Cheat Features

### Option 1: Production Build

```bash
cd frontend
npm run build
npm run electron:build:win
```

Run the built `.exe` to test full anti-cheat features.

### Option 2: Mock Production Mode

Temporarily change in your code:

```typescript
// Before
if (import.meta.env.DEV) {
  console.log('[Dev] Feature disabled');
  return;
}

// After (for testing)
if (false) {  // Force enable
  console.log('[Dev] Feature disabled');
  return;
}
```

**Remember to revert after testing!**

---

## Environment Variables

### Development (default)
```bash
NODE_ENV=development
VITE_DEV_MODE=true
```

### Production
```bash
NODE_ENV=production
VITE_DEV_MODE=false
```

---

## Debugging Tips

### 1. Check Backend Connection

```javascript
// Test backend health
fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend:', d))
  .catch(e => console.error('Backend offline:', e));
```

### 2. View Security Events

Open browser console → look for `[Dev]` messages

### 3. Test Memory Protection

```javascript
// This works in dev mode
import { ProtectedValue } from './utils/memoryProtection';

const gold = new ProtectedValue(1000);
console.log('Gold:', gold.value); // 1000
gold.add(500);
console.log('Gold:', gold.value); // 1500
```

### 4. Disable All Anti-Cheat (Temporary)

Comment out in `GamePage.tsx`:

```typescript
// useEffect(() => {
//   initializeSecurity();
//   AntiDebug.start(() => {
//     reportSecurityEvent('debugger_detected');
//   });
// }, []);
```

---

## Known Development Warnings

### "ReferenceError: dragEvent is not defined"

**Source:** MDX Editor dependency  
**Impact:** None - doesn't affect functionality  
**Fix:** Will be resolved in next dependency update  
**Workaround:** Can be safely ignored

### "Failed to report to server: 404"

**Source:** Security routes not mounted in dev  
**Impact:** None - logged to console instead  
**Fix:** Automatically handled in code  
**Workaround:** Already fixed - see `security.ts`

---

## Running in Dev Mode

```bash
# Frontend only (with mock data)
cd frontend
npm run dev

# Frontend + Backend
cd backend
npm run dev

# In another terminal
cd frontend  
npm run dev

# Electron dev mode
cd frontend
npm run electron:dev
```

---

## Building for Testing

### Quick Development Build

```bash
cd frontend
npm run build
npm run preview  # Test the production build locally
```

### Full Electron Build (with anti-cheat)

```bash
cd frontend
npm run build
npm run electron:build:win
```

Then run `dist-electron/Folkhart-*-Setup.exe`

---

## 🎮 Summary

- ✅ **Dev mode = No anti-cheat warnings**
- ✅ **Use DevTools freely**
- ✅ **Console messages are informational**
- ✅ **Build to test full protection**

**Happy coding!** 🚀
