cd assets
rm -f icon.icns 
rm -rf icons.iconset
mkdir icons.iconset 

# 使用 ImageMagick 创建圆角图标
echo "正在创建圆角图标..."
convert icon.png \
    \( +clone -alpha extract \
       \( -size %[fx:w]x%[fx:h] xc:black -fill white -draw "roundRectangle 0,0 %[fx:w-1],%[fx:h-1] 15,15" \) \
       -compose multiply -composite \
    \) -alpha off -compose CopyOpacity -composite icon_rounded.png

# 使用圆角图标生成各种尺寸
echo "正在生成各种尺寸的图标..."
sips -z 16 16 icon_rounded.png -o icons.iconset/icon_16x16.png 
sips -z 32 32 icon_rounded.png -o icons.iconset/icon_16x16@2x.png 
sips -z 32 32 icon_rounded.png -o icons.iconset/icon_32x32.png 
sips -z 64 64 icon_rounded.png -o icons.iconset/icon_32x32@2x.png 
sips -z 128 128 icon_rounded.png -o icons.iconset/icon_128x128.png 
sips -z 256 256 icon_rounded.png -o icons.iconset/icon_128x128@2x.png 
sips -z 256 256 icon_rounded.png -o icons.iconset/icon_256x256.png 
sips -z 512 512 icon_rounded.png -o icons.iconset/icon_256x256@2x.png 
sips -z 512 512 icon_rounded.png -o icons.iconset/icon_512x512.png 
sips -z 1024 1024 icon_rounded.png -o icons.iconset/icon_512x512@2x.png 

echo "正在生成 .icns 文件..."
iconutil -c icns icons.iconset -o icon.icns 

# 清理临时文件
rm -f icon_rounded.png
rm -rf icons.iconset

echo "图标生成完成！生成的文件：icon.icns" 