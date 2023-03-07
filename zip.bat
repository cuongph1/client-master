@RD /S /Q web
md web\web-mobile
xcopy  build\web-mobile\web-mobile\ web\web-mobile /E /Q
xcopy landing web /E /Q
