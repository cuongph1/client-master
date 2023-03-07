echo on
Echo zipping...
"C:\Program Files\7-Zip\7z.exe" a -tzip frontend.zip ..\F69_Logic\* -xr!build -xr!local -xr!web -xr!temp -xr!library -xr!.git
echo Done!