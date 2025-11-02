from PIL import Image, ImageDraw, ImageFont
import os

# Create directories if they don't exist
os.makedirs('public/screenshots/pc', exist_ok=True)
os.makedirs('public/screenshots/mac', exist_ok=True)

def create_placeholder(filename, title, subtitle="", width=1920, height=1080):
    # Create image with light gray background
    img = Image.new('RGB', (width, height), color='#f5f5f5')
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fall back to default if not available
    try:
        title_font = ImageFont.truetype("arial.ttf", 60)
        subtitle_font = ImageFont.truetype("arial.ttf", 40)
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()
    
    # Draw title
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    title_height = title_bbox[3] - title_bbox[1]
    title_x = (width - title_width) / 2
    title_y = (height - title_height) / 2 - 50
    
    draw.text((title_x, title_y), title, fill='#333333', font=title_font)
    
    # Draw subtitle if provided
    if subtitle:
        subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_font)
        subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
        subtitle_x = (width - subtitle_width) / 2
        subtitle_y = title_y + title_height + 30
        draw.text((subtitle_x, subtitle_y), subtitle, fill='#666666', font=subtitle_font)
    
    # Draw border
    draw.rectangle([(20, 20), (width-20, height-20)], outline='#cccccc', width=3)
    
    # Save image
    img.save(filename, 'PNG', quality=95)
    print(f"Created: {filename}")

# PC Placeholders
create_placeholder(
    'public/screenshots/pc/copy-path.png',
    'Windows: Copy File Paths',
    'Right-click menu showing "Copy as path"'
)

create_placeholder(
    'public/screenshots/pc/quick-import.png',
    'Quick Import Page',
    'Paste paths and click Auto Detect'
)

create_placeholder(
    'public/screenshots/pc/import-csv.png',
    'Import CSV',
    'Generate CSV and Import'
)

# Mac Placeholders
create_placeholder(
    'public/screenshots/mac/copy-path.png',
    'Mac: Copy File Paths',
    'Right-click menu showing "Copy as Path"'
)

create_placeholder(
    'public/screenshots/mac/quick-import.png',
    'Quick Import Page',
    'Paste paths and click Auto Detect'
)

create_placeholder(
    'public/screenshots/mac/import-csv.png',
    'Import CSV',
    'Generate CSV and Import'
)

# Also create temp placeholders for AI-generated images
create_placeholder(
    'public/screenshots/pc/install-google-drive.png',
    'Install Google Drive for Desktop',
    'Windows - REPLACE WITH AI GENERATED IMAGE'
)

create_placeholder(
    'public/screenshots/pc/streaming-mode.png',
    'Configure Streaming Mode',
    'Windows - REPLACE WITH AI GENERATED IMAGE'
)

create_placeholder(
    'public/screenshots/pc/scientology-folder.png',
    'Navigate to Scientology Folder',
    'Windows - REPLACE WITH AI GENERATED IMAGE'
)

create_placeholder(
    'public/screenshots/mac/install-google-drive.png',
    'Install Google Drive for Desktop',
    'Mac - REPLACE WITH AI GENERATED IMAGE'
)

create_placeholder(
    'public/screenshots/mac/streaming-mode.png',
    'Configure Streaming Mode',
    'Mac - REPLACE WITH AI GENERATED IMAGE'
)

create_placeholder(
    'public/screenshots/mac/scientology-folder.png',
    'Navigate to Scientology Folder',
    'Mac - REPLACE WITH AI GENERATED IMAGE'
)

print("\nAll placeholder images created successfully!")
print("\nNext steps:")
print("1. Generate AI images using the prompts in AI_IMAGE_PROMPTS.txt")
print("2. Replace the placeholder images in public/screenshots/")
print("3. Take actual screenshots of the app for steps 4-6")
