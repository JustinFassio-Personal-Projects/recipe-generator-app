# Social Share Preview Testing Guide

This guide provides step-by-step instructions for testing the enhanced social media share cards across various platforms.

## Prerequisites

1. Deploy your changes to production (https://recipegenerator.app)
2. Have at least one public recipe with an image to test
3. Have one recipe without an image to test the fallback

## Testing Platforms

### 1. Facebook Sharing Debugger

**URL**: https://developers.facebook.com/tools/debug/

**Steps**:

1. Navigate to the Facebook Sharing Debugger
2. Enter your recipe URL (e.g., `https://recipegenerator.app/view-recipe/[recipe-id]?shared=true`)
3. Click "Debug" or "Scrape Again" to fetch fresh metadata
4. Review the preview card

**What to check**:

- ✅ Recipe title displays correctly
- ✅ Description includes ingredient count, cooking time, and difficulty
- ✅ Recipe image displays (or fallback logo if no image)
- ✅ "Recipe Generator" appears as the site name
- ✅ Image dimensions are 1200x630 (or logo dimensions for fallback)
- ✅ All og: tags are present and correct

**Common issues**:

- If old data appears, click "Scrape Again" to force a refresh
- Facebook caches aggressively - may need to wait or use `&fbrefresh=CACHE_BUSTER`

---

### 2. Twitter Card Validator

**URL**: https://cards-dev.twitter.com/validator

**Steps**:

1. Navigate to the Twitter Card Validator
2. Enter your recipe URL
3. Click "Preview card"

**What to check**:

- ✅ Card type is "summary_large_image"
- ✅ Recipe title displays with proper formatting
- ✅ Description is truncated appropriately (160 chars)
- ✅ Recipe image displays prominently
- ✅ @RecipeGenerator appears as the site attribution

**Note**: Twitter Card Validator may require authentication. If unavailable, test by posting a tweet with the link.

---

### 3. LinkedIn Post Inspector

**URL**: https://www.linkedin.com/post-inspector/

**Steps**:

1. Navigate to LinkedIn Post Inspector
2. Enter your recipe URL
3. Click "Inspect"
4. Review the preview

**What to check**:

- ✅ Title, description, and image display correctly
- ✅ Image is clear and properly sized
- ✅ Recipe Generator branding is visible

**Alternative method**:

1. Create a new LinkedIn post
2. Paste the recipe URL
3. Wait for the preview to generate
4. Review the preview before posting

---

### 4. WhatsApp Link Preview

**Method 1: Web WhatsApp**

1. Open https://web.whatsapp.com
2. Select a conversation (or message yourself)
3. Paste the recipe URL
4. Wait for the preview to generate (may take 5-10 seconds)
5. Review the preview before sending

**Method 2: WhatsApp Mobile**

1. Open WhatsApp on your phone
2. Select a conversation
3. Paste the recipe URL
4. Wait for preview to load
5. Review before sending

**What to check**:

- ✅ Recipe image displays as thumbnail
- ✅ Recipe title appears as heading
- ✅ Description shows key details
- ✅ Preview loads within 10 seconds

**Note**: WhatsApp uses Open Graph tags (og:) for previews

---

### 5. iMessage Link Preview

**Method: iOS/macOS iMessage**

1. Open iMessage (on iPhone, iPad, or Mac)
2. Start a conversation
3. Paste the recipe URL
4. Wait for the preview to generate
5. Review the preview

**What to check**:

- ✅ Recipe image displays prominently
- ✅ Recipe title is clear
- ✅ Site name "Recipe Generator" appears
- ✅ Preview is visually appealing

**Note**: iMessage also uses Open Graph tags. May need to wait up to 30 seconds for preview.

---

### 6. Slack Link Preview

**Steps**:

1. Open Slack (any workspace)
2. Select a channel or DM
3. Paste the recipe URL
4. Wait for preview to unfurl
5. Review the preview

**What to check**:

- ✅ Recipe image displays
- ✅ Title and description are clear
- ✅ Preview is properly formatted
- ✅ Link is clickable

---

## Testing Checklist

### Recipe WITH Image

- [ ] Facebook preview shows recipe image
- [ ] Twitter preview shows recipe image
- [ ] LinkedIn preview shows recipe image
- [ ] WhatsApp preview shows recipe image
- [ ] iMessage preview shows recipe image
- [ ] All titles format correctly: "Recipe Title | Recipe Generator"
- [ ] Description includes metadata (ingredients, time, difficulty)
- [ ] Structured data (JSON-LD) is present in page source

### Recipe WITHOUT Image

- [ ] Facebook preview shows fallback logo
- [ ] Twitter preview shows fallback logo
- [ ] LinkedIn preview shows fallback logo
- [ ] WhatsApp preview shows fallback logo or text-only preview
- [ ] iMessage preview shows fallback logo or text-only preview
- [ ] All other metadata displays correctly

### Home Page / App Landing

- [ ] Facebook preview shows default app branding
- [ ] Twitter preview shows default app branding
- [ ] Title: "Recipe Generator - Create, Discover & Share Delicious Recipes"
- [ ] Description includes "AI-powered" and key features

---

## Validation Tools

### Check HTML Source

1. Navigate to a recipe page
2. Right-click → "View Page Source"
3. Search for `<meta property="og:`
4. Search for `<meta name="twitter:`
5. Search for `<script type="application/ld+json">`

**Verify**:

- All Open Graph tags are present
- All Twitter Card tags are present
- Structured data (JSON-LD) is properly formatted
- Image URLs are absolute (include https://)
- No duplicate tags

### Browser DevTools

1. Open recipe page
2. Press F12 or right-click → Inspect
3. Go to "Elements" or "Inspector" tab
4. Find `<head>` section
5. Review all meta tags

---

## Common Issues & Solutions

### Issue: Preview shows old data

**Solution**:

- Clear cache on testing platform
- Add cache-busting parameter: `?v=TIMESTAMP`
- Wait 5-10 minutes and try again
- Use "Scrape Again" on Facebook Debugger

### Issue: Image doesn't load

**Solution**:

- Verify image URL is absolute (includes https://)
- Check CORS headers on image
- Verify image is publicly accessible
- Try with different recipe that has image

### Issue: Description is cut off

**Solution**:

- Descriptions should be truncated at 160 characters
- This is expected behavior for optimal display
- Full content is visible when link is clicked

### Issue: Fallback logo doesn't show

**Solution**:

- Verify `/recipe-generator-logo.png` is accessible
- Check file is in `/public` directory
- Ensure file is deployed to production
- Try clearing CDN cache

---

## Expected Results Summary

### With Recipe Image

- **Image**: Recipe-specific photo (1200x630 recommended)
- **Title**: "Recipe Title | Recipe Generator"
- **Description**: "X ingredients | Y min | Z difficulty - [recipe description]"
- **Branding**: "Recipe Generator" visible

### Without Recipe Image

- **Image**: Recipe Generator logo (fallback)
- **Title**: "Recipe Title | Recipe Generator"
- **Description**: "X ingredients - [recipe description]"
- **Branding**: "Recipe Generator" visible

### Enhanced Share Text (Native Share)

When using the share button on mobile, users should see:

```
🍳 Check out this recipe: [Recipe Title]

✨ 8 ingredients | ⏱️ 45 min | 👨‍🍳 Medium difficulty

[Recipe description...]

Created with Recipe Generator 🍽️
```

---

## Post-Testing Actions

After successful testing:

1. ✅ Document any issues found
2. ✅ Verify all platforms show proper previews
3. ✅ Test on both mobile and desktop where applicable
4. ✅ Confirm structured data passes Google Rich Results Test
5. ✅ Share success screenshots with team
6. ✅ Monitor analytics for improved click-through rates

---

## Additional Resources

- **Facebook Open Graph**: https://developers.facebook.com/docs/sharing/webmasters
- **Twitter Cards**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- **Schema.org Recipe**: https://schema.org/Recipe
- **Google Rich Results**: https://search.google.com/test/rich-results

---

## Questions or Issues?

If you encounter any issues during testing:

1. Check browser console for errors
2. Verify all files are deployed to production
3. Clear browser cache and try again
4. Test with different recipes
5. Contact development team if issues persist

**Happy Testing! 🎉**
