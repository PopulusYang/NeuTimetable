cmake_minimum_required(VERSION 3.10)
project(NeuCourseTable)

# 显式设定默认的 CMAKE_BUILD_TYPE 为 Debug，以消除 VS Code 的 IntelliSense 报警
if(NOT CMAKE_BUILD_TYPE)
    set(CMAKE_BUILD_TYPE "Debug" CACHE STRING "Choose the type of build, options are: None Debug Release RelWithDebInfo MinSizeRel." FORCE)
endif()

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 强制静态链接，确保在没有安装 MinGW 的电脑上也能运行
if(MINGW)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -static -static-libgcc -static-libstdc++")
endif()

# 1. 编译后端解析库/程序
add_library(NeuCourseTabel SHARED src/NeuCourseTabel.cpp)
# 同时为了兼容老功能保留可执行文件(可选)
add_executable(NeuCourseTabel_exe src/NeuCourseTabel.cpp)

# 设置输出目录
set_target_properties(NeuCourseTabel PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin" LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
set_target_properties(NeuCourseTabel_exe PROPERTIES RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")

# 复制脚本和启动项到输出目录
if(WIN32)
    add_custom_command(TARGET NeuCourseTabel_exe POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/src/neuscraper_ui.py"
            "${CMAKE_BINARY_DIR}/bin/neuscraper_ui.py"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/src/web_server.py"
            "${CMAKE_BINARY_DIR}/bin/web_server.py"
        COMMAND ${CMAKE_COMMAND} -E copy_directory
            "${CMAKE_SOURCE_DIR}/resources/static"
            "${CMAKE_BINARY_DIR}/bin/eams/static"
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/requirements.txt"
            "${CMAKE_BINARY_DIR}/bin/requirements.txt"
        COMMENT "Copying scraper script and deployment files to bin folder"
    )
else()
    # Linux/Mac 平台的后续操作可以在这里定义，例如赋予执行权限等
    add_custom_command(TARGET NeuCourseTabel POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
            "${CMAKE_SOURCE_DIR}/src/neuscraper_ui.py"
            "${CMAKE_BINARY_DIR}/bin/neuscraper_ui.py"
        COMMENT "Copying scraper script to bin folder"
    )
endif()
