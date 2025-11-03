# 🎨 Custom NSIS Installer Images Guide

Create these images to customize your Folkhart installer appearance.

## Required Images

### 1. **installer-wizard.bmp**
**Dimensions:** 164 x 314 pixels  
**Format:** BMP (Bitmap)  
**Location:** Left sidebar of installer

**Design Tips:**
- Use your game's vertical artwork
- Match your game's color scheme (amber/dark stone)
- Can include logo, characters, or game scenes
- Keep important content in the center (avoid edges)

**Example Content:**
```
┌─────────────────┐
│                 │
│   FOLKHART      │
│     ⚔️🏰        │
│                 │
│   Cozy Fantasy  │
│      RPG        │
│                 │
│                 │
│                 │
│   [Game Art]    │
│                 │
│                 │
│                 │
└─────────────────┘
```

---

### 2. **installer-header.bmp**
**Dimensions:** 150 x 57 pixels  
**Format:** BMP (Bitmap)  
**Location:** Top right header of installer pages

**Design Tips:**
- Horizontal banner style
- Include logo/icon on the left
- Keep it simple and clean
- Use amber accent colors

**Example Content:**
```
┌────────────────────────────────────────┐
│ [Logo] FOLKHART - Cozy Fantasy RPG     │
└────────────────────────────────────────┘
```

---

### 3. **uninstaller-wizard.bmp**
**Dimensions:** 164 x 314 pixels  
**Format:** BMP (Bitmap)  
**Location:** Left sidebar of uninstaller

**Design Tips:**
- Similar to installer-wizard.bmp but can be different
- Could show "farewell" themed artwork
- Same dimensions as installer wizard

---

## Color Palette

Use these colors from Folkhart's theme:

```
Dark Stone:  #1C1917
Amber:       #F59E0B
Gold:        #FCD34D
Red Accent:  #DC2626
```

---

## How to Create

### Option 1: Using Photoshop/GIMP

1. Create new image with exact dimensions
2. Set background to dark stone (#1C1917)
3. Add your logo/artwork
4. Add text with amber color (#F59E0B)
5. Save as BMP format (24-bit)

### Option 2: Using Online Tools

1. Use Canva/Figma to design
2. Export as PNG with exact dimensions
3. Convert PNG to BMP using:
   - Online converter: convertio.co
   - Command line: `magick convert image.png image.bmp`

### Option 3: AI Generation

1. Use AI tools (Midjourney, DALL-E) to generate artwork
2. Resize to exact dimensions
3. Convert to BMP format

---

## Image Content Ideas

### For Installer Wizard (164x314):
- ⚔️ Character with sword standing heroically
- 🏰 Castle or dungeon entrance
- 🎮 Game logo with glowing effects
- 📜 Scroll with game features
- ⚡ Equipment showcase
- 🌟 Mystical/magical atmosphere

### For Header (150x57):
- Simple logo + game name
- Minimalist icon design
- Horizontal banner with gradient
- Weapon/shield icons

---

## Testing Your Images

1. Place .bmp files in `electron/assets/`
2. Build installer: `npm run electron:build:win`
3. Run installer to see how images look
4. Adjust and rebuild as needed

---

## Current Setup

**Files Referenced:**
- `installer-wizard.bmp` → Left sidebar during installation
- `installer-header.bmp` → Top header on all pages
- `uninstaller-wizard.bmp` → Left sidebar during uninstallation

**If files are missing:**
- Installer will use default Windows NSIS images
- No errors, just less customization
- You can add images later and rebuild

---

## Pro Tips

✅ **Keep file sizes small** - BMP files can be large
✅ **Test on different Windows versions** - Colors may vary slightly
✅ **Use high contrast** - Installer might add white backgrounds
✅ **Save source files** - Keep PSD/Figma files for future edits
✅ **Use game's existing artwork** - Maintain brand consistency

---

## Quick Start (Placeholder Method)

If you don't have custom images yet:

1. **Create solid color placeholders:**
   ```bash
   # Using ImageMagick
   magick -size 164x314 xc:#1C1917 installer-wizard.bmp
   magick -size 150x57 xc:#1C1917 installer-header.bmp
   magick -size 164x314 xc:#1C1917 uninstaller-wizard.bmp
   ```

2. **Build with placeholders** - Installer will work with solid colors

3. **Replace with real artwork later** - Just rebuild installer

---

## Need Help?

- Example images: Check `/examples/` folder (if available)
- BMP converters: convertio.co, cloudconvert.com
- Image editors: GIMP (free), Photoshop, Photopea (web)
- AI art: Midjourney, DALL-E, Stable Diffusion

---

**Remember:** The installer is the first impression of your game!  
Make it match Folkhart's cozy fantasy RPG aesthetic! ⚔️🏰✨
