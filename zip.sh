#!/bin/bash
#cd build/web-moblie/web-mobile
#rm -rf html.zip
#zip -r html.zip *
rm -rf web
mkdir web
cp -r build/web-moblie/web-mobile web
cp -r landing/* web
cd web
zip -r html.zip *
#com.fireball.Bao99