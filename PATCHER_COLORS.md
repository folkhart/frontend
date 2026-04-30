# 🎨 Folkhart Patcher - Color Scheme

## Your Game's Colors (Now in Patcher!)

### Primary Colors - Amber/Gold
```css
#fbbf24  /* Light amber - Text highlights */
#d97706  /* Amber - Borders, buttons */
#b45309  /* Dark amber - Header gradients */
#92400e  /* Very dark amber - Shadows */
```

### Background Colors - Stone/Dark
```css
#fef3c7  /* Cream - Main text */
#44403c  /* Stone - Container gradient */
#292524  /* Dark stone - Body background */
#1c1917  /* Very dark stone - Inputs, boxes */
```

### Accent Colors - Green (Success)
```css
#84cc16  /* Lime - Version text, dates */
#65a30d  /* Green - PLAY button, news border */
```

---

## Where Each Color Is Used

### Header
- **Background:** Amber gradient (#b45309 → #92400e)
- **Text:** Light amber (#fbbf24)
- **Border:** Light amber (#fbbf24)

### Game Status Box
- **Background:** Dark stone (rgba(28, 25, 23, 0.8))
- **Border:** Amber (#d97706)
- **Title:** Light amber (#fbbf24)
- **Text:** Cream (#fef3c7)
- **Version:** Lime green (#84cc16)

### News Section
- **Background:** Dark stone (rgba(28, 25, 23, 0.8))
- **Border:** Green (#65a30d)
- **Title:** Lime green (#84cc16)
- **Badge:** Amber (#d97706)
- **Date:** Lime green (#84cc16)

### Progress Bar
- **Background:** Very dark stone (#1c1917)
- **Border:** Amber (#d97706)
- **Fill:** Amber gradient (#d97706 → #f59e0b)
- **Text:** Cream (#fef3c7)

### PLAY Button
- **Background:** Green gradient (#65a30d → #84cc16)
- **Text:** White with shadow
- **Hover Glow:** Green (#65a30d)

### SETTINGS Button
- **Background:** Amber gradient (#b45309 → #d97706)
- **Text:** White with shadow
- **Hover Glow:** Amber (#d97706)

### Scrollbar
- **Track:** Very dark stone (#1c1917)
- **Thumb:** Amber (#d97706)
- **Hover:** Light amber (#f59e0b)

---

## Comparison: Before vs After

### ❌ Before (Generic Red)
- Red (#e94560) - Aggressive
- Blue (#16213e) - Cold
- Teal (#4ecca3) - Techy
- **Didn't match your game!**

### ✅ After (Folkhart Colors)
- Amber (#d97706) - Warm & Cozy
- Stone (#292524) - Medieval & Earthy
- Lime (#84cc16) - Natural & Positive
- **Perfectly matches your RPG!**

---

## Matching Your Game

### LandingPage Colors
```css
/* Your login screen uses: */
bg-amber-400  #fbbf24  ✅ Used in patcher
bg-amber-600  #d97706  ✅ Used in patcher
bg-amber-700  #b45309  ✅ Used in patcher
bg-stone-800  #292524  ✅ Used in patcher
```

### AdventureTab Colors
```css
/* Your game UI uses: */
Stone backgrounds  ✅ Matched
Amber borders      ✅ Matched
Green highlights   ✅ Matched
Warm text colors   ✅ Matched
```

---

## Retro Style Elements

✅ **Pixelated logo** - Added your titlebar logo  
✅ **Bold borders** - 3-4px solid borders everywhere  
✅ **Text shadows** - Black shadows for depth  
✅ **Gradients** - Subtle amber/stone gradients  
✅ **Pixel font** - Courier New, retro style  
✅ **Chunky buttons** - Big, easy to click  
✅ **Progress bars** - Striped animation  

---

## CSS Variables (Easy Customization)

If you want to adjust colors later, search for:

```css
/* Primary amber */
#d97706
#fbbf24
#b45309

/* Success green */
#84cc16
#65a30d

/* Dark stone */
#1c1917
#292524
```

**All colors centralized in `patcher.html` for easy editing!**

---

Your patcher now looks like it's **part of your game**, not a separate app! 🎮✨
