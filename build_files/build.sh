#!/bin/bash

echo "This script requires nwjs.app in your applications folder"

TARGET_DIR="${HOME}/Postbird.app"
APP_TARGET_DIR="${TARGET_DIR}/Contents/Resources/app.nw"
echo $TARGET_DIR


if [ -e "$TARGET_DIR" ]; then
  echo "Removing existing build"
  rm -rf $TARGET_DIR
fi

if [ -e "$HOME/postbird.nw" ]; then
  echo "Removing existing nw build"
  rm -rf $HOME/Postbird.nw
fi

#read -p "Is nwjs.app in your applications folder (y/n)? " -n 1 -r
#if [[ $REPLY =~ ^[Yy]$ ]]
#then
    # node-webkit exists continue build
    cp -r /Applications/nwjs.app ${TARGET_DIR}

    # create app.nw and move to correct location
    git checkout-index -a --prefix="${APP_TARGET_DIR}/"
    #cp -r . ~/postbird.app/Contents/Resources/app.nw

    rm ${APP_TARGET_DIR}/run
    rm ${APP_TARGET_DIR}/run_tests
    rm -rf ${APP_TARGET_DIR}/build_files
    rm -rf ${APP_TARGET_DIR}/node_modules/fibers
    rm -rf ${APP_TARGET_DIR}/node_modules/grunt
    rm -rf ${APP_TARGET_DIR}/node_modules/grunt-node-webkit-builder
    rm -rf ${APP_TARGET_DIR}/tests
    rm -rf ${APP_TARGET_DIR}/sugar
    rm -rf ${APP_TARGET_DIR}/integration_tests
    rm -rf ${APP_TARGET_DIR}/vendor/datasets
    rm -rf ${APP_TARGET_DIR}/vendor/win32
    rm -rf ${APP_TARGET_DIR}/vendor/linux

    # copy icon and plist file
    cp ./build_files/icon.icns  ${TARGET_DIR}/Contents/Resources
    cp ./build_files/info.plist ${TARGET_DIR}/Contents
    cp ./build_files/Credits.html ${TARGET_DIR}/Contents/Resources

    echo -e "\nPostbird.app copied to home directory"
    tmp_dir=`pwd`
    cd ${APP_TARGET_DIR}
    zip -r -q ~/Postbird.nw *
    cd $tmp_dir
#else
#  echo -e "\nPlease place nwjs.app in your applications folder and run the script again"
#fi